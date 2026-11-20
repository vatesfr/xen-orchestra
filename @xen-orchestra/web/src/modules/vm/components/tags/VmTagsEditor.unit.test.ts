import VmTagsEditor from '@/modules/vm/components/tags/VmTagsEditor.vue'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { fetchDelete, fetchPut } from '@/shared/utils/fetch.util.ts'
import { createVm } from '@/test/create-vm.ts'
import { findTags } from '@/test/find-rendered-values.ts'
import { getButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsTagSelect from '@core/components/tag-select/VtsTagSelect.vue'
import { type DOMWrapper, flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import type { Window as HappyDomWindow } from 'happy-dom'
import { defineComponent, h, type MaybeRef, ref, unref } from 'vue'

const { put, remove } = vi.hoisted(() => ({
  put: vi.fn(),
  remove: vi.fn(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchPut: put as unknown as typeof fetchPut,
  fetchDelete: remove as unknown as typeof fetchDelete,
}))

const vms = ref<FrontXoVm[]>([])

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({ vms })) as unknown as typeof useXoVmCollection,
}))

beforeEach(() => {
  put.mockReset()
  remove.mockReset()

  put.mockResolvedValue(undefined)
  remove.mockResolvedValue(undefined)
})

const vm = createVm({ id: 'vm-42' as FrontXoVm['id'], tags: ['production', 'web'] })

function mountTagsEditor(
  editedVm: MaybeRef<FrontXoVm> = vm,
  otherVmsTags: string[][] = [['production', 'db']],
  iconOnly = false
) {
  vms.value = [unref(editedVm), ...otherVmsTags.map(tags => createVm({ tags }))]

  return mount(
    defineComponent({
      setup: () => () => h(VmTagsEditor, { vm: unref(editedVm), iconOnly }),
    }),
    { global: createGlobalTestConfig() }
  )
}

function findVmTags(wrapper: VueWrapper) {
  return wrapper.findAll('.ui-tags-list > .ui-tag')
}

function findTagSelect(wrapper: VueWrapper) {
  return wrapper.findComponent(VtsTagSelect)
}

function findTrigger(wrapper: VueWrapper) {
  return findTagSelect(wrapper).get('.ui-button, .ui-button-icon')
}

async function openTagSelect(wrapper: VueWrapper) {
  await flushPromises()
  await findTrigger(wrapper).trigger('click')
  await flushPromises()
}

async function searchTag(wrapper: VueWrapper, search: string) {
  await wrapper.get('.search-container input').setValue(search)
  await flushPromises()
}

function findTagOptions(wrapper: VueWrapper) {
  return wrapper.findAll('.ui-dropdown').map(option => {
    const info = option.find('.info')

    return info.exists() ? [option.get('.text-ellipsis').text(), info.text()] : [option.get('.text-ellipsis').text()]
  })
}

function findCheckedTagOptions(wrapper: VueWrapper) {
  return wrapper
    .findAll('.ui-dropdown')
    .filter(option => option.get<HTMLInputElement>('input[type="checkbox"]').element.checked)
    .map(option => option.get('.text-ellipsis').text())
}

function getOptionTag(option: DOMWrapper<Element>) {
  const tertiaryTag = option.find('.ui-tertiary-tag')

  if (!tertiaryTag.exists()) {
    return option.get('.ui-tag').text()
  }

  const [term, value] = tertiaryTag.findAll('.ui-tag')

  return `${term.text()}=${value.text()}`
}

async function clickButton(wrapper: VueWrapper, label: string) {
  await getButton(wrapper, label).trigger('click')
  await flushPromises()
}

async function clickTagOption(wrapper: VueWrapper, tag: string) {
  const option = wrapper.findAll('.ui-dropdown').find(option => getOptionTag(option) === tag)

  if (option === undefined) {
    throw new Error(`No option for the tag "${tag}"`)
  }

  await option.trigger('click')
  await flushPromises()
}

async function removeSelectedTag(wrapper: VueWrapper, tag: string) {
  const selectedTag = wrapper
    .get('.current-tags')
    .findAll('.ui-tag')
    .find(selectedTag => selectedTag.text() === tag)

  if (selectedTag === undefined) {
    throw new Error(`No selected tag "${tag}"`)
  }

  await selectedTag.get('button.remove').trigger('click')
  await flushPromises()
}

const DEFAULT_VIEWPORT_WIDTH = 1024

function setViewportWidth(width: number) {
  ;(window as unknown as HappyDomWindow).happyDOM.setViewport({ width })
}

describe('tags of the VM', () => {
  it('lists the tags of the VM', () => {
    const wrapper = mountTagsEditor()

    expect(findVmTags(wrapper).map(tag => tag.text())).toEqual(['production', 'web'])
  })

  it('displays the tags of the VM with the brand accent', () => {
    const wrapper = mountTagsEditor()

    expect(findVmTags(wrapper).every(tag => tag.classes('accent--brand'))).toBe(true)
  })

  it('offers to add tags when the VM has none', () => {
    const wrapper = mountTagsEditor(createVm({ tags: [] }))

    expect(() => getButton(wrapper, t('action:add'))).not.toThrow()
  })

  it('offers to edit the tags when the VM has some', () => {
    const wrapper = mountTagsEditor()

    expect(() => getButton(wrapper, t('action:edit'))).not.toThrow()
  })

  it('does not offer to remove the tags outside of the dropdown', () => {
    const wrapper = mountTagsEditor()

    expect(findVmTags(wrapper).every(tag => !tag.find('button').exists())).toBe(true)
  })
})

describe('tag suggestions', () => {
  it('lists all the tags in alphabetical order, with the number of VMs using each', async () => {
    const wrapper = mountTagsEditor(vm, [['production', 'db'], ['analytics']])

    await openTagSelect(wrapper)

    expect(findTagOptions(wrapper)).toEqual([
      ['analytics', t('n-vms', 1)],
      ['db', t('n-vms', 1)],
      ['production', t('n-vms', 2)],
      ['web', t('n-vms', 1)],
    ])
  })

  it('checks the tags of the VM', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)

    expect(findCheckedTagOptions(wrapper)).toEqual(['production', 'web'])
  })

  it('keeps the order of the tags while they are selected and deselected', async () => {
    const wrapper = mountTagsEditor(vm, [['production', 'db'], ['analytics']])

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'db')
    await clickTagOption(wrapper, 'web')

    expect(findTagOptions(wrapper).map(([label]) => label)).toEqual(['analytics', 'db', 'production', 'web'])
    expect(findCheckedTagOptions(wrapper)).toEqual(['db', 'production'])
  })

  it('keeps listing a created tag once deselected', async () => {
    const wrapper = mountTagsEditor(vm, [])

    await openTagSelect(wrapper)
    await searchTag(wrapper, 'brand-new')
    await clickTagOption(wrapper, 'brand-new')
    await searchTag(wrapper, '')
    await clickTagOption(wrapper, 'brand-new')

    expect(findTagOptions(wrapper).map(([label]) => label)).toEqual(['brand-new', 'production', 'web'])
    expect(findCheckedTagOptions(wrapper)).toEqual(['production', 'web'])
  })

  it('filters the tags on the search', async () => {
    const wrapper = mountTagsEditor(vm, [['production', 'db'], ['production-eu']])

    await openTagSelect(wrapper)
    await searchTag(wrapper, 'prod')

    expect(findTagOptions(wrapper).map(([label]) => label)).toEqual([
      `${t('action:create')}prod`,
      'production',
      'production-eu',
    ])
  })
})

describe('adding a tag', () => {
  it('adds an existing tag picked in the suggestions', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'db')
    await clickButton(wrapper, t('action:save'))

    expect(put.mock.calls).toEqual([['vms/vm-42/tags/db']])
    expect(remove).not.toHaveBeenCalled()
  })

  it('removes a tag of the VM unchecked in the suggestions', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'web')
    await clickButton(wrapper, t('action:save'))

    expect(remove.mock.calls).toEqual([['vms/vm-42/tags/web']])
    expect(put).not.toHaveBeenCalled()
  })

  it('offers to create the searched tag when no tag matches it exactly', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await searchTag(wrapper, '  brand-new  ')

    expect(findTagOptions(wrapper)).toEqual([[`${t('action:create')}brand-new`]])
  })

  it('displays the tag to create with a "+" instead of a checkbox', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await searchTag(wrapper, 'brand-new')

    const [createOption] = wrapper.findAll('.ui-dropdown')

    expect(createOption.find('input[type="checkbox"]').exists()).toBe(false)
    expect(createOption.find('.vts-icon').exists()).toBe(true)
  })

  it('explains how to create a scoped tag', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)

    expect(wrapper.text()).toContain(t('scoped-tag-hint'))
  })

  it('creates the searched tag', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await searchTag(wrapper, 'brand-new')
    await clickTagOption(wrapper, 'brand-new')
    await clickButton(wrapper, t('action:save'))

    expect(put).toHaveBeenCalledWith('vms/vm-42/tags/brand-new')
  })

  it('does not offer to create a tag that already exists', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await searchTag(wrapper, 'db')

    expect(findTagOptions(wrapper)).toEqual([['db', t('n-vms', 1)]])
  })
})

describe('saving the tags', () => {
  it('does not send any request until the changes are saved', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'db')
    await clickTagOption(wrapper, 'web')

    expect(put).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
  })

  it('keeps the save button enabled when nothing has changed', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)

    expect(getButton(wrapper, t('action:save')).attributes('disabled')).toBeUndefined()

    await clickTagOption(wrapper, 'db')
    await clickTagOption(wrapper, 'db')

    expect(getButton(wrapper, t('action:save')).attributes('disabled')).toBeUndefined()
  })

  it('only closes the dropdown when saving without changes', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'db')
    await clickTagOption(wrapper, 'db')
    await clickButton(wrapper, t('action:save'))

    expect(put).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
    expect(wrapper.find('.ui-dropdown-list').exists()).toBe(false)
  })

  it('sends the additions and removals and closes the dropdown on save', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'db')
    await clickTagOption(wrapper, 'web')
    await clickButton(wrapper, t('action:save'))

    expect(put.mock.calls).toEqual([['vms/vm-42/tags/db']])
    expect(remove.mock.calls).toEqual([['vms/vm-42/tags/web']])
    expect(wrapper.find('.ui-dropdown-list').exists()).toBe(false)
  })

  it.each([
    ['text', false],
    ['icon-only', true],
  ])('marks the %s trigger as busy until the tags are saved', async (_, iconOnly) => {
    let resolvePut = () => {}

    put.mockReturnValue(
      new Promise<void>(resolve => {
        resolvePut = resolve
      })
    )

    const wrapper = mountTagsEditor(vm, undefined, iconOnly)

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'db')
    await clickButton(wrapper, t('action:save'))

    const trigger = findTrigger(wrapper)

    expect(findTagSelect(wrapper).find('.ui-loader').exists()).toBe(true)
    expect(trigger.attributes('disabled')).toBeDefined()

    resolvePut()
    await flushPromises()

    expect(findTagSelect(wrapper).find('.ui-loader').exists()).toBe(false)
    expect(trigger.attributes('disabled')).toBeUndefined()
  })

  it('keeps the changes in progress when the VM is updated meanwhile', async () => {
    const editedVm = ref(vm)

    const wrapper = mountTagsEditor(editedVm)

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'db')
    await clickTagOption(wrapper, 'web')

    editedVm.value = { ...vm, tags: [...vm.tags] }
    await flushPromises()

    expect(findCheckedTagOptions(wrapper)).toEqual(['db', 'production'])
  })

  it('only saves its own changes when the tags of the VM are changed meanwhile', async () => {
    const editedVm = ref(vm)

    const wrapper = mountTagsEditor(editedVm)

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'db')

    editedVm.value = { ...vm, tags: ['production', 'backup'] }
    await flushPromises()

    await clickButton(wrapper, t('action:save'))

    expect(put.mock.calls).toEqual([['vms/vm-42/tags/db']])
    expect(remove.mock.calls).toEqual([])
  })

  it('discards the changes on cancel', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'db')
    await clickButton(wrapper, t('cancel'))

    expect(wrapper.find('.ui-dropdown-list').exists()).toBe(false)

    await openTagSelect(wrapper)

    expect(findCheckedTagOptions(wrapper)).toEqual(['production', 'web'])
    expect(put).not.toHaveBeenCalled()
  })

  it('discards the changes when the dropdown is closed without saving', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'db')
    await findTagSelect(wrapper).trigger('keydown', { key: 'Escape' })
    await flushPromises()
    await openTagSelect(wrapper)

    expect(findCheckedTagOptions(wrapper)).toEqual(['production', 'web'])
    expect(put).not.toHaveBeenCalled()
  })
})

describe('selecting all the tags', () => {
  it('adds all the tags missing from the VM', async () => {
    const wrapper = mountTagsEditor(vm, [['production', 'db'], ['analytics']])

    await openTagSelect(wrapper)
    await clickButton(wrapper, t('action:select-all'))
    await clickButton(wrapper, t('action:save'))

    expect(put.mock.calls).toEqual([['vms/vm-42/tags/analytics'], ['vms/vm-42/tags/db']])
    expect(remove).not.toHaveBeenCalled()
  })

  it('only adds the tags matching the search', async () => {
    const wrapper = mountTagsEditor(vm, [['production', 'db'], ['analytics']])

    await openTagSelect(wrapper)
    await searchTag(wrapper, 'db')
    await clickButton(wrapper, t('action:select-all'))
    await clickButton(wrapper, t('action:save'))

    expect(put.mock.calls).toEqual([['vms/vm-42/tags/db']])
  })

  it('removes all the tags of the VM', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await clickButton(wrapper, t('action:deselect-all'))
    await clickButton(wrapper, t('action:save'))

    expect(remove.mock.calls).toEqual([['vms/vm-42/tags/production'], ['vms/vm-42/tags/web']])
    expect(put).not.toHaveBeenCalled()
  })

  it('cannot select all the tags when they are all already selected', async () => {
    const wrapper = mountTagsEditor(vm, [])

    await openTagSelect(wrapper)

    expect(getButton(wrapper, t('action:select-all')).attributes('disabled')).toBeDefined()
    expect(getButton(wrapper, t('action:deselect-all')).attributes('disabled')).toBeUndefined()
  })

  it('cannot deselect all the tags when none of the listed tags is selected', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await searchTag(wrapper, 'db')

    expect(getButton(wrapper, t('action:select-all')).attributes('disabled')).toBeUndefined()
    expect(getButton(wrapper, t('action:deselect-all')).attributes('disabled')).toBeDefined()
  })
})

describe('selected tags', () => {
  it('lists the selected tags above the search, in alphabetical order', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'db')

    expect(findTags(wrapper.get('.current-tags'))).toEqual(['db', 'production', 'web'])
  })

  it('deselects a tag removed from the selected tags', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await removeSelectedTag(wrapper, 'web')

    expect(findTags(wrapper.get('.current-tags'))).toEqual(['production'])
    expect(findCheckedTagOptions(wrapper)).toEqual(['production'])

    await clickButton(wrapper, t('action:save'))

    expect(remove.mock.calls).toEqual([['vms/vm-42/tags/web']])
  })

  it('hides the selected tags when no tag is selected', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)

    expect(wrapper.find('.current-tags').exists()).toBe(true)

    await clickButton(wrapper, t('action:deselect-all'))

    expect(wrapper.find('.current-tags').exists()).toBe(false)
  })
})

describe('empty tag', () => {
  const vmWithEmptyTag = createVm({ id: 'vm-42' as FrontXoVm['id'], tags: ['', 'production'] })

  it('displays the empty tag with a placeholder', () => {
    const wrapper = mountTagsEditor(vmWithEmptyTag)

    expect(findVmTags(wrapper).map(tag => tag.text())).toEqual([t('empty-tag'), 'production'])
  })

  it('does not offer the empty tag in the suggestions', async () => {
    const wrapper = mountTagsEditor(vm, [['', 'db']])

    await openTagSelect(wrapper)

    expect(findTagOptions(wrapper).map(([tag]) => tag)).toEqual(['db', 'production', 'web'])
  })

  it('lists the empty tag of the VM in the selected tags, without offering to remove it', async () => {
    const wrapper = mountTagsEditor(vmWithEmptyTag)

    await openTagSelect(wrapper)

    const emptyTag = wrapper.get('.current-tags .ui-tag')

    expect(emptyTag.text()).toBe(t('empty-tag'))
    expect(emptyTag.find('button.remove').exists()).toBe(false)
  })

  it('keeps the empty tag of the VM when deselecting all the tags', async () => {
    const wrapper = mountTagsEditor(vmWithEmptyTag)

    await openTagSelect(wrapper)
    await clickButton(wrapper, t('action:deselect-all'))

    expect(findTags(wrapper.get('.current-tags'))).toEqual([t('empty-tag')])

    await clickButton(wrapper, t('action:save'))

    expect(remove.mock.calls).toEqual([['vms/vm-42/tags/production']])
    expect(put).not.toHaveBeenCalled()
  })
})

describe('whitespace-only tag', () => {
  it('displays a whitespace-only tag of the VM as an empty tag', () => {
    const wrapper = mountTagsEditor(createVm({ tags: ['   ', 'production'] }), [])

    expect(findTags(wrapper)).toEqual([t('empty-tag'), 'production'])
  })

  it('removes a whitespace-only tag of the VM unchecked in the suggestions', async () => {
    const wrapper = mountTagsEditor(createVm({ id: 'vm-42' as FrontXoVm['id'], tags: ['   ', 'production'] }), [])

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, t('empty-tag'))
    await clickButton(wrapper, t('action:save'))

    expect(remove.mock.calls).toEqual([['vms/vm-42/tags/%20%20%20']])
  })
})

describe('dropdown layout', () => {
  afterEach(() => setViewportWidth(DEFAULT_VIEWPORT_WIDTH))

  it('floats the dropdown next to its trigger on a large screen', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)

    const dropdown = wrapper.get<HTMLElement>('.dropdown-list')

    expect(dropdown.classes('fullscreen')).toBe(false)
    expect(dropdown.element.style.position).toBe('fixed')
  })

  it('opens the dropdown fullscreen on a small screen', async () => {
    setViewportWidth(800)

    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)

    const dropdown = wrapper.get<HTMLElement>('.dropdown-list')

    expect(dropdown.classes('fullscreen')).toBe(true)
    expect(dropdown.element.style.position).toBe('')
  })
})
