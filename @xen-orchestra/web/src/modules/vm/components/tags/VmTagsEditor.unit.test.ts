import VmTagsEditor from '@/modules/vm/components/tags/VmTagsEditor.vue'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { fetchDelete, fetchPut } from '@/shared/utils/fetch.util.ts'
import { createVm } from '@/test/create-vm.ts'
import { getButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsOverlayList from '@core/components/overlay/VtsOverlayList.vue'
import { type DOMWrapper, flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, type MaybeRef, ref, unref } from 'vue'

const { put, remove } = vi.hoisted(() => ({
  put: vi.fn(),
  remove: vi.fn(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchPut: put as unknown as typeof fetchPut,
  fetchDelete: remove as unknown as typeof fetchDelete,
}))

// The VMs of the pool, from which the tag suggestions are built
const vms = ref<FrontXoVm[]>([])

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  // `vms` is only read once the component mounts, after this module has been evaluated
  useXoVmCollection: (() => ({ vms })) as unknown as typeof useXoVmCollection,
}))

beforeEach(() => {
  put.mockReset()
  remove.mockReset()

  put.mockResolvedValue(undefined)
  remove.mockResolvedValue(undefined)
})

const vm = createVm({ id: 'vm-42' as FrontXoVm['id'], tags: ['production', 'web'] })

// The special-tag confirmation is an overlay: the overlay list renders it, as `App.vue` does
// Pass a ref as `editedVm` to update the VM once mounted
function mountTagsEditor(editedVm: MaybeRef<FrontXoVm> = vm, otherVmsTags: string[][] = [['production', 'db']]) {
  vms.value = [unref(editedVm), ...otherVmsTags.map(tags => createVm({ tags }))]

  return mount(
    defineComponent({
      setup: () => () => h('div', [h(VmTagsEditor, { vm: unref(editedVm) }), h(VtsOverlayList)]),
    }),
    { global: createGlobalTestConfig() }
  )
}

// The tags of the VM, as rendered next to the "Add" button, and not those listed in its dropdown
function findVmTags(wrapper: VueWrapper) {
  return wrapper.findAll('.ui-tags-list > .ui-tag')
}

// The special-tag modal is loaded asynchronously when it opens
async function settle() {
  await flushPromises()
  await vi.dynamicImportSettled()
  await flushPromises()
}

async function openTagSelect(wrapper: VueWrapper) {
  await flushPromises()
  await wrapper.get('.vts-tag-select > .ui-button').trigger('click')
  await flushPromises()
}

async function searchTag(wrapper: VueWrapper, search: string) {
  await wrapper.get('.search-container input').setValue(search)
  await flushPromises()
}

// Each option as the tag it offers, preceded by "Create" for a new one, and followed by its info
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

// A `term=value` tag is rendered as a tertiary tag, with its term and its value in two distinct tags
function getOptionTag(option: DOMWrapper<Element>) {
  const tertiaryTag = option.find('.ui-tertiary-tag')

  if (!tertiaryTag.exists()) {
    return option.get('.ui-tag').text()
  }

  const [term, value] = tertiaryTag.findAll('.ui-tag')

  return `${term.text()}=${value.text()}`
}

async function clickTagOption(wrapper: VueWrapper, tag: string) {
  const option = wrapper.findAll('.ui-dropdown').find(option => getOptionTag(option) === tag)

  if (option === undefined) {
    throw new Error(`No option for the tag "${tag}"`)
  }

  await option.trigger('click')
  await settle()
}

function findModalTexts(wrapper: VueWrapper) {
  const modal = wrapper.find('.ui-modal')

  if (!modal.exists()) {
    return undefined
  }

  return {
    title: modal.get(`#${modal.get('[role="dialog"]').attributes('aria-labelledby')}`).text(),
    content: modal.get('.content').text(),
    confirm: modal.get('button[type="submit"]').text(),
  }
}

async function confirmModal(wrapper: VueWrapper) {
  await wrapper.get('.ui-modal').trigger('submit')
  await flushPromises()
}

async function cancelModal(wrapper: VueWrapper) {
  await getButton(wrapper, t('action:go-back')).trigger('click')
  await flushPromises()
}

describe('tags of the VM', () => {
  it('lists the tags of the VM', () => {
    const wrapper = mountTagsEditor()

    expect(findVmTags(wrapper).map(tag => tag.text())).toEqual(['production', 'web'])
  })

  it('highlights the special tags', () => {
    const wrapper = mountTagsEditor(createVm({ tags: ['production', 'xo:no-bak'] }))

    expect(
      findVmTags(wrapper)
        .filter(tag => tag.classes('accent--warning'))
        .map(tag => tag.text())
    ).toEqual(['xo:no-bak'])
  })

  it('offers to add tags when the VM has none', () => {
    const wrapper = mountTagsEditor(createVm({ tags: [] }))

    expect(() => getButton(wrapper, t('action:add'))).not.toThrow()
  })

  it('offers to edit the tags when the VM has some', () => {
    const wrapper = mountTagsEditor()

    expect(() => getButton(wrapper, t('action:edit'))).not.toThrow()
  })

  it('does not offer to remove a tag outside of the suggestions', () => {
    const wrapper = mountTagsEditor()

    expect(findVmTags(wrapper).every(tag => !tag.find('button').exists())).toBe(true)
  })
})

describe('tag suggestions', () => {
  it('lists the tags of the VM first, then the other tags of the pool, with the number of VMs using each', async () => {
    const wrapper = mountTagsEditor(vm, [['production', 'db'], ['analytics']])

    await openTagSelect(wrapper)

    expect(findTagOptions(wrapper)).toEqual([
      ['production', t('n-vms', 2)],
      ['web', t('n-vms', 1)],
      ['analytics', t('n-vms', 1)],
      ['db', t('n-vms', 1)],
    ])
  })

  it('checks the tags of the VM', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)

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

    expect(put).toHaveBeenCalledWith('vms/vm-42/tags/db')
  })

  it('removes a tag of the VM unchecked in the suggestions', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'web')

    expect(remove).toHaveBeenCalledWith('vms/vm-42/tags/web')
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

    expect(put).toHaveBeenCalledWith('vms/vm-42/tags/brand-new')
  })

  it('displays a loader at the end of the tag suggestion until the tag is added', async () => {
    let resolvePut = () => {}

    put.mockReturnValue(
      new Promise<void>(resolve => {
        resolvePut = resolve
      })
    )

    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'db')

    const findLoadingTags = () =>
      wrapper
        .findAll('.ui-dropdown')
        .filter(option => option.find('.ui-loader').exists())
        .map(getOptionTag)

    expect(findLoadingTags()).toEqual(['db'])

    resolvePut()
    await flushPromises()

    expect(findLoadingTags()).toEqual([])
  })

  it('keeps the tags being added and removed in their new state when the VM is updated meanwhile', async () => {
    put.mockReturnValue(new Promise<void>(() => {}))
    remove.mockReturnValue(new Promise<void>(() => {}))

    const editedVm = ref(vm)

    const wrapper = mountTagsEditor(editedVm)

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'db')
    await clickTagOption(wrapper, 'web')

    // Any update of the VM replaces it, with a new `tags` array
    editedVm.value = { ...vm, tags: [...vm.tags] }
    await flushPromises()

    expect(findCheckedTagOptions(wrapper)).toEqual(['production', 'db'])
  })

  it('unchecks a tag that failed to be added once the suggestions are reopened', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    put.mockRejectedValue(new Error('Failed to add the tag'))

    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'db')
    await wrapper.get('.vts-tag-select').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    await openTagSelect(wrapper)

    expect(findCheckedTagOptions(wrapper)).toEqual(['production', 'web'])
  })

  it('does not offer to create a tag that already exists', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await searchTag(wrapper, 'db')

    expect(findTagOptions(wrapper)).toEqual([['db', t('n-vms', 1)]])
  })
})

describe('selecting all the tags', () => {
  it('adds all the tags missing from the VM', async () => {
    const wrapper = mountTagsEditor(vm, [['production', 'db'], ['analytics']])

    await openTagSelect(wrapper)
    await getButton(wrapper, t('action:select-all')).trigger('click')
    await flushPromises()

    expect(put.mock.calls).toEqual([['vms/vm-42/tags/analytics'], ['vms/vm-42/tags/db']])
    expect(remove).not.toHaveBeenCalled()
  })

  it('only adds the tags matching the search', async () => {
    const wrapper = mountTagsEditor(vm, [['production', 'db'], ['analytics']])

    await openTagSelect(wrapper)
    await searchTag(wrapper, 'db')
    await getButton(wrapper, t('action:select-all')).trigger('click')
    await flushPromises()

    expect(put.mock.calls).toEqual([['vms/vm-42/tags/db']])
  })

  it('removes all the tags of the VM', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await getButton(wrapper, t('action:deselect-all')).trigger('click')
    await flushPromises()

    expect(remove.mock.calls).toEqual([['vms/vm-42/tags/production'], ['vms/vm-42/tags/web']])
    expect(put).not.toHaveBeenCalled()
  })

  it('cannot select all the tags when they are all already selected', async () => {
    const wrapper = mountTagsEditor(vm, [])

    await openTagSelect(wrapper)

    expect(getButton(wrapper, t('action:select-all')).attributes('disabled')).toBeDefined()
    expect(getButton(wrapper, t('action:deselect-all')).attributes('disabled')).toBeUndefined()
  })
})

describe('special tags', () => {
  it('asks for a confirmation before adding a special tag', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await searchTag(wrapper, 'xo:notify-on-snapshot')
    await clickTagOption(wrapper, 'xo:notify-on-snapshot')

    expect(findModalTexts(wrapper)).toEqual({
      title: t('vm-tag:add-special-tag?', { tag: 'xo:notify-on-snapshot' }),
      content: t('vm-tag:special-tag-description'),
      confirm: t('action:add-tag'),
    })
    expect(put).not.toHaveBeenCalled()
  })

  it('adds the special tag once confirmed', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await searchTag(wrapper, 'xo:notify-on-snapshot')
    await clickTagOption(wrapper, 'xo:notify-on-snapshot')
    await confirmModal(wrapper)

    expect(put).toHaveBeenCalledWith(`vms/vm-42/tags/${encodeURIComponent('xo:notify-on-snapshot')}`)
  })

  it('does not add the special tag when the confirmation is cancelled', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await searchTag(wrapper, 'xo:notify-on-snapshot')
    await clickTagOption(wrapper, 'xo:notify-on-snapshot')
    await cancelModal(wrapper)

    expect(findModalTexts(wrapper)).toBeUndefined()
    expect(put).not.toHaveBeenCalled()
  })

  it('warns that adding the no-bak tag excludes the VM from backups', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await searchTag(wrapper, 'xo:no-bak')
    await clickTagOption(wrapper, 'xo:no-bak')

    expect(findModalTexts(wrapper)).toEqual({
      title: t('vm-tag:exclude-from-backups?'),
      content: t('vm-tag:no-bak-add-description', { tag: 'xo:no-bak' }),
      confirm: t('action:add-tag'),
    })
  })

  it('asks for a confirmation before removing a special tag', async () => {
    const wrapper = mountTagsEditor(createVm({ id: 'vm-42' as FrontXoVm['id'], tags: ['xo:notify-on-snapshot'] }))

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'xo:notify-on-snapshot')

    expect(findModalTexts(wrapper)).toEqual({
      title: t('vm-tag:remove-special-tag?', { tag: 'xo:notify-on-snapshot' }),
      content: t('vm-tag:special-tag-description'),
      confirm: t('action:remove-tag'),
    })
    expect(remove).not.toHaveBeenCalled()
  })

  it('warns that removing the no-bak tag lets the VM be backed up again, and removes it once confirmed', async () => {
    const wrapper = mountTagsEditor(createVm({ id: 'vm-42' as FrontXoVm['id'], tags: ['xo:no-bak=Reason'] }))

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'xo:no-bak=Reason')

    expect(findModalTexts(wrapper)).toEqual({
      title: t('vm-tag:back-up-again?'),
      content: t('vm-tag:no-bak-remove-description', { tag: 'xo:no-bak=Reason' }),
      confirm: t('action:remove-tag'),
    })

    await confirmModal(wrapper)

    expect(remove).toHaveBeenCalledWith(`vms/vm-42/tags/${encodeURIComponent('xo:no-bak=Reason')}`)
  })
})
