import datetime
from dataclasses import dataclass
from datetime import date
from typing import Union, Optional

FieldType = Union['DATE', 'TIMESTAMP', 'VARCHAR', 'FLOAT', 'INTEGER', 'BOOLEAN']
FieldMode = Union['NULLABLE', 'REQUIRED', 'REPEATED']


@dataclass(frozen=True)
class Field:
    name: str
    description: str
    type: FieldType
    mode: FieldMode
    numDistinctValues: int
    values: list[int, float, str, date]


@dataclass(frozen=True)
class DateField(Field):
    minDate: datetime.date
    maxDate: datetime.date
    numRowsByDate: dict[datetime.date, int]


@dataclass(frozen=True)
class Schema:
    name: str
    countRows: int
    description: Optional[str]
    fields: list[Field]
    previewData: list[dict[str, str]]


@dataclass(frozen=True)
class Dataset:
    name: str
    project: str


@dataclass(frozen=True)
class BigquerySchema(Schema):
    isDateSuffixPartitionTable: bool


@dataclass(frozen=True)
class FileSchema(Schema):
    pass
