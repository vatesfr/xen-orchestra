import type { ComparisonOperator, ComplexMatcherNode } from "complex-matcher";
import * as CM from "complex-matcher";
import type { FilterComparisonType } from "@/types/filter";
import { escapeRegExp } from "@/libs/utils";

function buildStringNode(property: string, value: string, negate = false) {
  if (!value) {
    return;
  }

  const node = new CM.Property(property, new CM.StringNode(value));

  if (negate) {
    return new CM.Not(node);
  }

  return node;
}

function buildRegexNode(
  property: string,
  value: string,
  prefix = "",
  suffix = "",
  escape = false,
  negate = false
) {
  if (!value) {
    return;
  }

  if (escape) {
    value = escapeRegExp(value);
  }

  const node = new CM.Property(
    property,
    new CM.RegExpNode(`${prefix}${value}${suffix}`, "i")
  );

  if (negate) {
    return new CM.Not(node);
  }

  return node;
}

function buildNumberComparisonNode(
  property: string,
  value: string | number,
  comparisonOperator: ComparisonOperator | "="
) {
  if (typeof value === "string") {
    value = parseInt(value, 10);
  }

  if (isNaN(value)) {
    return;
  }

  if (comparisonOperator === "=") {
    return new CM.Property(property, new CM.Number(value));
  }

  return new CM.Property(
    property,
    new CM.Comparison(comparisonOperator, value)
  );
}

function buildBooleanNode(property: string, value: boolean) {
  const node = new CM.TruthyProperty(property);

  if (!value) {
    return new CM.Not(node);
  }

  return node;
}

export function buildComplexMatcherNode(
  comparisonType: FilterComparisonType,
  property: string,
  value: string,
  negate: boolean
): ComplexMatcherNode | undefined {
  switch (comparisonType) {
    case "stringContains":
      return buildStringNode(property, value, negate);
    case "stringStartsWith":
      return buildRegexNode(property, value, "^", "", true, negate);
    case "stringEndsWith":
      return buildRegexNode(property, value, "", "$", true, negate);
    case "stringEquals":
      return buildRegexNode(property, value, "^", "$", true, negate);
    case "stringMatchesRegex":
      return buildRegexNode(property, value, "", "", false, negate);
    case "numberLessThan":
      return buildNumberComparisonNode(property, value, "<");
    case "numberLessThanOrEquals":
      return buildNumberComparisonNode(property, value, "<=");
    case "numberEquals":
      return buildNumberComparisonNode(property, value, "=");
    case "numberGreaterThanOrEquals":
      return buildNumberComparisonNode(property, value, ">=");
    case "numberGreaterThan":
      return buildNumberComparisonNode(property, value, ">");
    case "booleanTrue":
      return buildBooleanNode(property, true);
    case "booleanFalse":
      return buildBooleanNode(property, false);
  }
}
