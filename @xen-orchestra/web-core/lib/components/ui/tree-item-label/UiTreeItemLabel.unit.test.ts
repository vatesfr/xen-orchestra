import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import i18n from '@core/i18n.ts'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

async function mountLabel(props: { route: string; active?: boolean; exactActive?: boolean }, currentPath = '/vms') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: ['/', '/vms', '/vms/a'].map(path => ({ path, component: { render: () => null } })),
  })
  await router.push(currentPath)

  return mount(UiTreeItemLabel, { props, global: { plugins: [i18n, createPinia(), router] } })
}

const activeClass = async (...args: Parameters<typeof mountLabel>) => {
  const classes = (await mountLabel(...args)).classes()

  return classes.includes('exact-active') ? 'exact-active' : classes.includes('active') ? 'active' : undefined
}

describe('UiTreeItemLabel', () => {
  it('follows the state of its link', async () => {
    expect(await activeClass({ route: '/vms' })).toBe('exact-active')
    expect(await activeClass({ route: '/' })).toBe(undefined)
  })

  it('is active with `active`, unless its link is exactly active', async () => {
    expect(await activeClass({ route: '/', active: true })).toBe('active')
    expect(await activeClass({ route: '/vms', active: true })).toBe('exact-active')
  })

  // e.g. routes differing only by their query, which `RouterLink` ignores
  it('lets `exactActive` replace the state of its link, `active` included', async () => {
    expect(await activeClass({ route: '/vms', exactActive: false, active: true })).toBe(undefined)
    expect(await activeClass({ route: '/', exactActive: true })).toBe('exact-active')
  })
})
