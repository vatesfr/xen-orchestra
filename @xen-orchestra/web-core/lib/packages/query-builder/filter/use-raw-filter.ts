import { parseContainsValue } from '@core/packages/query-builder/filter/parsers/parse-contains-value.ts'
import { parseEndsWithValue } from '@core/packages/query-builder/filter/parsers/parse-ends-with-value.ts'
import { parseGlobValue } from '@core/packages/query-builder/filter/parsers/parse-glob-value.ts'
import { parseIsValue } from '@core/packages/query-builder/filter/parsers/parse-is-value.ts'
import { parseNumberValue } from '@core/packages/query-builder/filter/parsers/parse-number-value.ts'
import { parseRegexValue } from '@core/packages/query-builder/filter/parsers/parse-regex-value.ts'
import { parseStartsWithValue } from '@core/packages/query-builder/filter/parsers/parse-starts-with-value.ts'
import { renderFilter } from '@core/packages/query-builder/filter/render-filter.ts'
import type { PropertyOperator } from '@core/packages/query-builder/types.ts'
import { type Ref, computed } from 'vue'

export function useRawFilter(property: Ref<string>, operator: Ref<PropertyOperator>, value: Ref<string>) {
  return computed<string>(() => {
    if (value.value === '' && !['is', 'isNot', 'isEmpty', 'isNotEmpty'].includes(operator.value)) {
      return ''
    }

    switch (operator.value) {
      case 'contains':
      case 'doesNotContain':
        return renderFilter(property.value, parseContainsValue(value.value), operator.value === 'doesNotContain')
      case 'is':
      case 'isNot':
        return renderFilter(property.value, parseIsValue(value.value), operator.value === 'isNot')
      case 'startsWith':
      case 'doesNotStartWith':
        return renderFilter(property.value, parseStartsWithValue(value.value), operator.value === 'doesNotStartWith')
      case 'endsWith':
      case 'doesNotEndWith':
        return renderFilter(property.value, parseEndsWithValue(value.value), operator.value === 'doesNotEndWith')
      case 'matchesRegex':
      case 'doesNotMatchRegex':
        return renderFilter(property.value, parseRegexValue(value.value), operator.value === 'doesNotMatchRegex')
      case 'matchesGlob':
      case 'doesNotMatchGlob':
        return renderFilter(property.value, parseGlobValue(value.value), operator.value === 'doesNotMatchGlob')
      case 'greaterThan':
        return renderFilter(property.value, `>${parseNumberValue(value.value)}`, false)
      case 'greaterThanOrEqual':
        return renderFilter(property.value, `>=${parseNumberValue(value.value)}`, false)
      case 'lessThan':
        return renderFilter(property.value, `<${parseNumberValue(value.value)}`, false)
      case 'lessThanOrEqual':
        return renderFilter(property.value, `<=${parseNumberValue(value.value)}`, false)
      case 'isEmpty':
        return `!${property.value}?`
      case 'isNotEmpty':
        return `${property.value}?`
      default:
        return value.value ?? ''
    }
  })
}
