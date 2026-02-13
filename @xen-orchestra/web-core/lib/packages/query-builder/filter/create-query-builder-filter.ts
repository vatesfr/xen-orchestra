import { useFilterOperator } from '@core/packages/query-builder/filter/use-filter-operator.ts'
import { useFilterProperty } from '@core/packages/query-builder/filter/use-filter-property.ts'
import { useFilterValue } from '@core/packages/query-builder/filter/use-filter-value.ts'
import { useRawFilter } from '@core/packages/query-builder/filter/use-raw-filter.ts'
import type { PropertyOperator, QueryBuilderConfig, QueryBuilderFilter } from '@core/packages/query-builder/types.ts'
import { logicAnd } from '@vueuse/math'
import { computed, reactive, watch } from 'vue'

let nextId = 1

export function createQueryBuilderFilter(config: QueryBuilderConfig): QueryBuilderFilter {
  const id = `filter-${nextId++}`

  const { property, isPropertyValid, propertyOptions, currentPropertySchema } = useFilterProperty(
    config.schema,
    config.property
  )

  const { operator, currentOperatorSchema, isOperatorValid, operatorsSchema, operatorOptions } = useFilterOperator(
    currentPropertySchema,
    config.operator
  )

  const { value, isValueValid, valuesSchema, valueOptions } = useFilterValue(currentOperatorSchema, config.value)

  const isValid = logicAnd(isPropertyValid, isOperatorValid, isValueValid)

  function checkValue() {
    const values = operatorsSchema.value[operator.value].values

    if (values && values[value.value] === undefined) {
      value.value = Object.keys(values)[0]
    }
  }

  watch(operatorsSchema, () => {
    if (operatorsSchema.value !== undefined && operatorsSchema.value[operator.value] === undefined) {
      operator.value = Object.keys(operatorsSchema.value)[0] as PropertyOperator
    } else {
      checkValue()
    }
  })

  watch(operator, () => checkValue())

  const valueType = computed(() => {
    if (currentOperatorSchema.value?.expectValue === false) {
      return 'none'
    }

    if (valuesSchema.value !== undefined) {
      return 'select'
    }

    return 'input'
  })

  const rawFilter = useRawFilter(property, operator, value)

  return reactive({
    id,
    property,
    operator,
    value,
    isGroup: false,
    rawFilter,
    propertyOptions,
    operatorOptions,
    valueOptions,
    isValid,
    valueType,
  })
}
