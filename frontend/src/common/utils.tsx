import { ReactNode } from "react";
import { DimensionSliceKey } from "./types";
import { Badge, Bold, Text } from "@tremor/react";

export function sortDimension(
  dimension1: {
    dimension: string;
    value: string;
  },
  dimension2: {
    dimension: string;
    value: string;
  }
): number {
  return dimension1.dimension.toLowerCase() > dimension2.dimension.toLowerCase()
    ? 1
    : -1;
}

export function serializeDimensionSliceKey(key: DimensionSliceKey): string {
  return [...key]
    .sort(sortDimension)
    .map((k) => `${k.dimension}:${k.value}`)
    .join("|");
}

export function formatDimensionSliceKeyForRendering(
  key: DimensionSliceKey,
  parentKey?: DimensionSliceKey,
  addBorder: boolean = true
): ReactNode {
  const copiedKey = [...key];
  const copiedParentKey = [...(parentKey ?? [])];

  return [
    ...copiedParentKey.sort(sortDimension),
    ...copiedKey
      .filter(
        (k) =>
          (parentKey ?? []).filter(
            (pk) => pk.dimension === k.dimension && pk.value === k.value
          ).length === 0
      )
      .sort(sortDimension),
  ]
    .map((k) => (
      <span
        className={`text-black ${addBorder ? `border-2 bg-gray-100 p-1` : ""}`}
      >
        {k.dimension} = {k.value}
      </span>
    ))
    .flatMap((element, index, array) =>
      array.length - 1 !== index
        ? [element, <Text className="px-1">AND</Text>]
        : [element]
    );
}

export function getRegexMatchPatternForDimensionSliceKey(
  key: DimensionSliceKey
): RegExp {
  const baseRegexStr = [...key]
    .sort((k1, k2) =>
      k1.dimension.toLowerCase() > k2.dimension.toLowerCase() ? 1 : -1
    )
    .map((k) => `${k.dimension}:[^\\|]+`)
    .join("\\|");

  return new RegExp(`^${baseRegexStr}$`);
}
