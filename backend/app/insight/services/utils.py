import datetime
from typing import Tuple

import polars as pl
from polars import Expr

from app.insight.services.metrics import Metric, flatten, Filter, FilterOperator


def build_aggregation_expressions(
        metrics: list[Metric]
) -> list[pl.Expr]:
    return flatten([metric.get_aggregation_exprs() for metric in metrics]) + [
        pl.count("date").alias("count")
    ]


def build_base_df(
        df: pl.DataFrame,
        date_range: Tuple[datetime.date, datetime.date],
        group_by_columns: list[str],
        metrics: list[Metric]
) -> pl.DataFrame:
    return df.filter(
        pl.col('date').is_between(
            pl.lit(date_range[0]),
            pl.lit(date_range[1])
        )
    ).groupby(group_by_columns).agg(build_aggregation_expressions(metrics))


def prepare_joined_df(
        baseline_df: pl.DataFrame,
        comparison_df: pl.DataFrame,
        group_by_columns: list[str],
        metrics: list[Metric]
) -> pl.DataFrame:
    analyzing_metric = metrics[0]

    return comparison_df.join(
        baseline_df,
        on=group_by_columns,
        suffix='_baseline',
        how='outer'
    ).fill_nan(0).fill_null(0) \
        .with_columns(pl.lit([group_by_columns], dtype=pl.List).alias("dimension_name")) \
        .with_columns(pl.concat_list([pl.col(column).cast(str) for column in group_by_columns]).alias("dimension_value")) \
        .with_columns(
        pl.concat_list([pl.concat_str(pl.lit(f"{column}:"), pl.col(column).cast(str)) for column in group_by_columns]).list.join('|').alias(
            "serialized_key")) \
        .with_columns(
        pl.when(
            pl.col(f"{analyzing_metric.get_id()}_baseline") == 0
        ).then(
            pl.when(pl.col(analyzing_metric.get_id()) > 0).then(pl.lit(1)).otherwise(pl.lit(-1))
        ).otherwise(
            (pl.col(analyzing_metric.get_id()) - pl.col(f"{analyzing_metric.get_id()}_baseline")) / pl.col(
                f"{analyzing_metric.get_id()}_baseline")
        ).alias("change")) \
        .drop(group_by_columns) \
        .sort(analyzing_metric.get_sorting_expr(), descending=True)


def get_num_rows(df: pl.DataFrame) -> int:
    return df.select(pl.count()).item(0, 0)


def get_filter_expression(filters: list[Filter]) -> Expr:
    filter_expr = pl.lit(True)

    for filter in filters:
        expr = pl.col(filter.column).cast(pl.Utf8)
        if filter.operator == FilterOperator.EQ:
            expr = expr.is_in(filter.values)
        elif filter.operator == FilterOperator.NEQ:
            expr = expr.is_in(filter.values).is_not()
        elif filter.operator == FilterOperator.EMPTY:
            expr = expr.is_null() | expr.len().eq(0)
        elif filter.operator == FilterOperator.NON_EMPTY:
            expr = expr.is_not_null() & expr.len().gt(0)

        filter_expr = filter_expr & expr

    return filter_expr


def load_df_from_csv(path: str, date_column: str = None):
    df = pl.read_csv(path, try_parse_dates=True)
    for column_and_d_type in zip(df.columns, df.dtypes):
        [column, d_type] = column_and_d_type
        if date_column is not None and column != date_column:
            continue

        if d_type == pl.Utf8:
            non_null_count = df.filter(pl.col(column).str.lengths().gt(0) & pl.col(column).is_not_null()).select(pl.col(column).count()).row(0)[0]
            if non_null_count > 0:
                try:
                    df = df.with_columns(
                        pl.col(column).str.to_date("%-m/%-d/%y %k:%M").alias(column)
                    )
                except:
                    pass
    return df
