import type { StateHeroType } from '@core/components/state-hero/VtsStateHero.vue'
import type { TableState } from '@core/components/table/VtsTable.vue'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

type TableStateInput = undefined | boolean | string | TableState

export function useTableState(config: {
  busy?: MaybeRefOrGetter<TableStateInput>
  error?: MaybeRefOrGetter<TableStateInput>
  empty?: MaybeRefOrGetter<TableStateInput>
}) {
  const { t } = useI18n()

  const DEFAULT_MESSAGES: { [K in StateHeroType]?: string } = {
    'no-data': t('no-data'),
    'no-result': t('no-result'),
    error: t('error-no-data'),
  }

  function handleStateInput(
    defaultType: StateHeroType,
    inputRaw: MaybeRefOrGetter<TableStateInput>
  ): TableState | undefined {
    const input = toValue(inputRaw)

    if (input === undefined) {
      return undefined
    }

    if (typeof input === 'object') {
      return { message: DEFAULT_MESSAGES[input.type], ...input }
    }

    if (typeof input === 'string') {
      return { type: defaultType, message: input }
    }

    if (input) {
      return {
        type: defaultType,
        message: DEFAULT_MESSAGES[defaultType],
      }
    }

    return undefined
  }

  return computed(() => {
    return (
      handleStateInput('busy', config.busy) ??
      handleStateInput('error', config.error) ??
      handleStateInput('no-data', config.empty)
    )
  })
}
