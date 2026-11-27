import MenuItem from '@core/components/menu/MenuItem.vue'
import VtsHeaderCell from '@core/components/table/cells/VtsHeaderCell.vue'
import UiColumnHeader from '@core/components/ui/column-header/UiColumnHeader.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import { type ColumnSortDirection, IK_COLUMN_SORT } from '@core/packages/table'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { t } from '@core-test/i18n.ts'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { computed } from 'vue'

function mountHeaderCell({
  sortable = false,
  direction,
  setDirection = () => {},
}: {
  sortable?: boolean
  direction?: ColumnSortDirection
  setDirection?: (direction: ColumnSortDirection) => void
} = {}) {
  const provide = sortable ? { [IK_COLUMN_SORT]: { direction: computed(() => direction), setDirection } } : {}

  return mount(VtsHeaderCell, {
    global: createGlobalTestConfig({ provide }),
    attrs: { style: 'width: 4rem;' },
    slots: { default: 'Name' },
  })
}

async function openSortMenu(wrapper: VueWrapper) {
  await wrapper.get('th button').trigger('click')
  await flushPromises()
}

function findSortOptions(wrapper: VueWrapper) {
  return wrapper.findAllComponents(MenuItem).map(item => ({
    label: item.text(),
    checked: item.getComponent(UiRadioButton).get<HTMLInputElement>('input').element.checked,
  }))
}

describe('when the column is not sortable', () => {
  it('renders a plain header cell', () => {
    const header = mountHeaderCell().getComponent(UiColumnHeader)

    expect(header.props('interactive')).toBe(false)
    expect(header.text()).toBe('Name')
    expect(header.attributes('style')).toBe('width: 4rem;')
  })
})

describe('when the column is sortable', () => {
  it('renders an interactive header cell', () => {
    const header = mountHeaderCell({ sortable: true }).getComponent(UiColumnHeader)

    expect(header.props('interactive')).toBe(true)
    expect(header.text()).toBe('Name')
    expect(header.attributes('style')).toBe('width: 4rem;')
  })

  it.each([
    { direction: undefined, icon: undefined, ariaSort: undefined },
    { direction: 'asc' as const, icon: 'fa:arrow-down', ariaSort: 'ascending' },
    { direction: 'desc' as const, icon: 'fa:arrow-up', ariaSort: 'descending' },
  ])('shows the $direction sort on the header', ({ direction, icon, ariaSort }) => {
    const header = mountHeaderCell({ sortable: true, direction }).getComponent(UiColumnHeader)

    expect(header.props('icon')).toBe(icon)
    expect(header.attributes('aria-sort')).toBe(ariaSort)
  })

  it('opens a menu controlled by the header button', async () => {
    const wrapper = mountHeaderCell({ sortable: true })

    await openSortMenu(wrapper)

    const button = wrapper.get('th button')
    const menu = wrapper.getComponent(MenuItem).element.closest('ul[role="menu"]')

    expect(button.attributes()).toMatchObject({
      'aria-haspopup': 'menu',
      'aria-expanded': 'true',
      'aria-controls': menu?.id,
    })
    expect(menu?.id).toBeTruthy()
    expect(wrapper.getComponent(UiColumnHeader).props('selected')).toBe(true)
  })

  it('lists both directions, the current one checked', async () => {
    const wrapper = mountHeaderCell({ sortable: true, direction: 'desc' })

    await openSortMenu(wrapper)

    expect(findSortOptions(wrapper)).toEqual([
      { label: t('action:sort-ascending'), checked: false },
      { label: t('action:sort-descending'), checked: true },
    ])
  })

  it('sets the direction of the selected option', async () => {
    const setDirection = vi.fn()
    const wrapper = mountHeaderCell({ sortable: true, setDirection })

    await openSortMenu(wrapper)
    await wrapper.findAllComponents(MenuItem)[1].get('[role="menuitem"]').trigger('click')
    await flushPromises()

    expect(setDirection).toHaveBeenCalledWith('desc')
  })
})
