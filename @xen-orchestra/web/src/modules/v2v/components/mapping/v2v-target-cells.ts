import V2vTargetSelect from '@/modules/v2v/components/mapping/V2vTargetSelect.vue'
import V2vValueOrigin from '@/modules/v2v/components/mapping/V2vValueOrigin.vue'
import type { V2vResolvedTarget, V2vTargetOption } from '@/modules/v2v/types/v2v-mapping.type.ts'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
import { h } from 'vue'

export type V2vTargetCellsConfig<TId extends string> = {
  target: V2vResolvedTarget<TId>
  options: V2vTargetOption<TId>[]
  loading: boolean
  // `undefined` resets the target to its default
  onChange: (id: TId | undefined) => void
}

// The last two cells of a mapping table row: the target select, then where its value comes from. The config is a
// getter, read at render time: a table line keeps its cells while its row changes
export function renderV2vTargetCells<TId extends string>(getConfig: () => V2vTargetCellsConfig<TId>) {
  return {
    target: () => {
      const { target, options, loading, onChange } = getConfig()

      return renderBodyCell(() =>
        h(V2vTargetSelect<TId>, { modelValue: target.value, options, loading, 'onUpdate:modelValue': onChange })
      )
    },
    origin: () => {
      const { target, onChange } = getConfig()

      return renderBodyCell(() => h(V2vValueOrigin, { origin: target.origin, onReset: () => onChange(undefined) }))
    },
  }
}
