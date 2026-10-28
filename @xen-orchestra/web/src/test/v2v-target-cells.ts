import V2vValueOrigin from '@/modules/v2v/components/mapping/V2vValueOrigin.vue'
import type { V2vResolvedTarget, V2vTargetOption } from '@/modules/v2v/types/v2v-mapping.type.ts'
import { findTableColumnCells } from '@/test/find-table-cells.ts'
import { getButton } from '@/test/get-button.ts'
import { t } from '@/test/i18n.ts'
import type { VueWrapper } from '@vue/test-utils'

type V2vTargetRow = { key: string; target: V2vResolvedTarget<string> }

type V2vTargetCellsCase = {
  // Mounted with its selects loading, so that the test sees the flag pass through
  mountTable: () => VueWrapper
  targetHeader: string
  changeEvent: string
  rows: V2vTargetRow[]
  options: V2vTargetOption<string>[]
}

// Found by its definition, a generic component is typed as a plain element: its name keeps its props and its emits
export function getV2vTargetSelect(wrapper: Pick<VueWrapper, 'getComponent'>) {
  return wrapper.getComponent({ name: 'V2vTargetSelect' })
}

function findV2vTargetSelects(wrapper: Pick<VueWrapper, 'findAll'>, targetHeader: string) {
  return findTableColumnCells(wrapper, targetHeader).map(getV2vTargetSelect)
}

// Every mapping table ends its rows the same way: the target select, then where its value comes from
export function describeV2vTargetCells({ mountTable, targetHeader, changeEvent, rows, options }: V2vTargetCellsCase) {
  describe('target cells', () => {
    it('shows the target of each row among the offered ones', () => {
      expect(findV2vTargetSelects(mountTable(), targetHeader).map(select => select.props())).toEqual(
        rows.map(({ target }) => ({ modelValue: target.value, options, loading: true }))
      )
    })

    it('tells where the target of each row comes from', () => {
      const origins = findTableColumnCells(mountTable(), t('value-from')).map(cell =>
        cell.getComponent(V2vValueOrigin).props('origin')
      )

      expect(origins).toEqual(rows.map(({ target }) => target.origin))
    })

    it('emits the target chosen for a row', () => {
      const wrapper = mountTable()
      const [, otherOption] = options

      findV2vTargetSelects(wrapper, targetHeader)[0].vm.$emit('update:modelValue', otherOption.id)

      expect(wrapper.emitted(changeEvent)).toEqual([[rows[0].key, otherOption.id]])
    })

    it('emits the reset of an overridden row', async () => {
      const wrapper = mountTable()
      const overriddenIndex = rows.findIndex(({ target }) => target.origin === 'overridden')

      await getButton(
        findTableColumnCells(wrapper, t('value-from'))[overriddenIndex],
        t('action:reset-to-default')
      ).trigger('click')

      expect(wrapper.emitted(changeEvent)).toEqual([[rows[overriddenIndex].key, undefined]])
    })
  })
}
