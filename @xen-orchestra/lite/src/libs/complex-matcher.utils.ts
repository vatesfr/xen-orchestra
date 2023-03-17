import { escapeRegExp } from "@/libs/utils";
import type { FilterComparisonType } from "@/types/filter";
import type { ComparisonOperator, ComplexMatcherNode } from "complex-matcher";
import * as CM from "complex-matcher";

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
  value: string
): ComplexMatcherNode | undefined {
  switch (comparisonType) {
    case "stringContains":
    case "stringDoesNotContains":
      return buildStringNode(
        property,
        value,
        comparisonType === "stringDoesNotContains"
      );

    case "stringStartsWith":
    case "stringDoesNotStartWith":
      return buildRegexNode(
        property,
        value,
        "^",
        "",
        true,
        comparisonType === "stringDoesNotStartWith"
      );

    case "stringEndsWith":
    case "stringDoesNotEndWith":
      return buildRegexNode(
        property,
        value,
        "",
        "$",
        true,
        comparisonType === "stringDoesNotEndWith"
      );

    case "stringEquals":
    case "stringDoesNotEqual":
    case "enumIs":
    case "enumIsNot":
      return buildRegexNode(
        property,
        value,
        "^",
        "$",
        true,
        ["stringDoesNotEqual", "enumIsNot"].includes(comparisonType)
      );

    case "stringMatchesRegex":
    case "stringDoesNotMatchRegex":
      return buildRegexNode(
        property,
        value,
        "",
        "",
        false,
        comparisonType === "stringDoesNotMatchRegex"
      );

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
