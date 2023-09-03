import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import {
  Text
} from "@tremor/react";
import { useEffect, useState } from "react";
import {
  AggregationType,
  ColumnType,
  TargetDirection
} from "../../../types/report-config";
import SingleSelector from "../SingleSelector";

type Props = {
  getValidMetricColumns: () => string[];
  selectedColumns: { [key: string]: { type: string } };
  onSelectMetrics: (metrics: string[], type: ColumnType) => void;
  onSelectMetricAggregationOption: (metric: string, option: AggregationType) => void;
  targetDirection: TargetDirection;
  setTargetDirection: (direction: TargetDirection) => void;
}


const MetricConfig = (props: Props) => {
  const { getValidMetricColumns, selectedColumns, onSelectMetrics, onSelectMetricAggregationOption, targetDirection, setTargetDirection } = props;
  const [metricType, setMetricType] = useState<AggregationType>("sum");
  const [metricColumn, setMetricColumn] = useState<string>("");

  useEffect(() => {
    if (metricColumn !== "") {
      onSelectMetricAggregationOption(metricColumn, metricType);
    }
  }, [metricColumn, metricType, onSelectMetricAggregationOption]);

  return (
    <>
      <SingleSelector
        title={
          <Text className="pr-4 text-black">
            Select the metric type
          </Text>
        }
        labels={["Sum", "Count", "Count Distinct", "Ratio"]}
        values={["sum", "count", "count_distinct", "ratio"]}
        selectedValue={metricType}
        onValueChange={(metric) => {
          setMetricType(metric as AggregationType);
        }}
      />

      <SingleSelector
        title={
          <Text className="pr-4 text-black">
            Select the metric column
          </Text>
        }
        labels={getValidMetricColumns()}
        values={getValidMetricColumns()}
        selectedValue={
          Object.keys(selectedColumns).filter(
            (c) => selectedColumns[c]["type"] === "metric"
          ).length > 0
            ? Object.keys(selectedColumns).filter(
                (c) => selectedColumns[c]["type"] === "metric"
              )[0]
            : ""
        }
        onValueChange={(metric) => {
          setMetricColumn(metric);
          onSelectMetrics([metric], "metric");
        }}
      />
      <SingleSelector
        title={
          <Text className="pr-4 text-black">Target metric direction</Text>
        }
        labels={["Increasing", "Decreasing"]}
        values={["increasing", "decreasing"]}
        icons={[ArrowUpIcon, ArrowDownIcon]}
        selectedValue={targetDirection}
        onValueChange={(v) => setTargetDirection(v as TargetDirection)}
        key="target-metric-direction"
        instruction={
          <Text>
            Target direction of the metric movement. E.g: "Increasing" for
            revenue and "Decreasing" for canceled orders.
          </Text>
        }
      />
    </>
  );
}

export default MetricConfig;