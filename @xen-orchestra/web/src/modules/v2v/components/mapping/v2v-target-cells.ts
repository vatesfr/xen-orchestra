import V2vTargetSelect from '@/modules/v2v/components/mapping/V2vTargetSelect.vue'
import V2vValueOrigin from '@/modules/v2v/components/mapping/V2vValueOrigin.vue'
import type { V2vResolvedTarget, V2vTargetOption } from '@/modules/v2v/types/v2v-mapping.type.ts'
import { getV2vTargetOptionLabel } from '@/modules/v2v/utils/v2v-mapping.util.ts'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
import { h, type VNode } from 'vue'

export type V2vTargetCellsConfig<TId extends string> = {
  target: V2vResolvedTarget<TId>
  options: V2vTargetOption<TId>[]
  loading: boolean
  // A read-only row names its target, with no select nor reset
  readonly: boolean
  // `undefined` resets the target to its default
  onChange: (id: TId | undefined) => void
}

// The last two cells of a mapping table row: the target, then where its value comes from. The config is a getter,
// read at render time: a table line keeps its cells while its row changes
export function renderV2vTargetCells<TId extends string>(getConfig: () => V2vTargetCellsConfig<TId>) {
  return {
    target: (renderText: (content: string) => VNode) => {
      const { target, options, loading, readonly, onChange } = getConfig()

      if (readonly) {
        return renderText(getV2vTargetOptionLabel(options, target.value))
      }

      return renderBodyCell(() =>
        h(V2vTargetSelect<TId>, { modelValue: target.value, options, loading, 'onUpdate:modelValue': onChange })
      )
    },
    origin: () => {
      const { target, readonly, onChange } = getConfig()

      return renderBodyCell(() =>
        h(V2vValueOrigin, { origin: target.origin, readonly, onReset: () => onChange(undefined) })
      )
    },
  }
}
