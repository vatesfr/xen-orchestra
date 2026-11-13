import type { useVdfAvailability } from '@/modules/vdf/composables/vdf-availability.composable.ts'
import type { useVdfPublishedPolicy } from '@/modules/vdf/remote-resources/use-vdf-published-policy.ts'
import type { VdfFirewallAction } from '@/modules/vdf/utils/vdf-rights.util.ts'
import VmTagsEditor from '@/modules/vm/components/tags/VmTagsEditor.vue'
import { useVmReservedTags } from '@/modules/vm/composables/use-vm-reserved-tags.composable.ts'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { ApiError } from '@/shared/error/api.error.ts'
import type { fetchDelete, fetchPut } from '@/shared/utils/fetch.util.ts'
import { createVm } from '@/test/create-vm.ts'
import { findTooltipContent } from '@/test/find-tooltip-content.ts'
import { getButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import VtsOverlayList from '@core/components/overlay/VtsOverlayList.vue'
import { RemoteResourceFetchError } from '@core/packages/remote-resource/remote-resource-fetch.error.ts'
import { type DOMWrapper, flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { computed, defineComponent, h, type MaybeRef, ref, unref } from 'vue'

const { put, remove } = vi.hoisted(() => ({
  put: vi.fn(),
  remove: vi.fn(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchPut: put as unknown as typeof fetchPut,
  fetchDelete: remove as unknown as typeof fetchDelete,
}))

// The firewall (vdf plugin): `policy` is the pool's policy answer, whose `rights` say what the current user may do with
// the pool's firewall; `error`, why it failed (403: the user may not read it)
type FirewallRights = Partial<Record<VdfFirewallAction, boolean>>

const { vdf } = vi.hoisted(() => ({
  vdf: {
    enabled: false,
    policy: undefined as { rights?: FirewallRights; canEdit?: boolean } | undefined,
    error: undefined as Error | undefined,
  },
}))

vi.mock(import('@/modules/vdf/composables/vdf-availability.composable.ts'), () => ({
  useVdfAvailability: (() => ({ isVdfEnabled: computed(() => vdf.enabled) })) as unknown as typeof useVdfAvailability,
}))

vi.mock(import('@/modules/vdf/remote-resources/use-vdf-published-policy.ts'), () => ({
  useVdfPublishedPolicy: (() => ({
    publishedPolicy: computed(() => vdf.policy),
    publishedPolicyError: computed(() => vdf.error),
  })) as unknown as typeof useVdfPublishedPolicy,
}))

// what each kind of user may do with the pool's firewall, as the policy answer says
const ALL_RIGHTS: FirewallRights = {
  read: true,
  publish: true,
  membership: true,
  'quarantine:add': true,
  'quarantine:remove': true,
}

const OPERATOR_RIGHTS: FirewallRights = {
  read: true,
  publish: false,
  membership: false,
  'quarantine:add': true,
  'quarantine:remove': true,
}

function setRights(rights: FirewallRights | 'forbidden') {
  vdf.enabled = true

  if (rights === 'forbidden') {
    vdf.policy = undefined
    vdf.error = new RemoteResourceFetchError({ status: 403, statusText: 'Forbidden' })
  } else {
    vdf.policy = { rights, canEdit: rights.publish }
    vdf.error = undefined
  }
}

// The VMs of the pool, from which the tag suggestions are built
const vms = ref<FrontXoVm[]>([])

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  // `vms` is only read once the component mounts, after this module has been evaluated
  useXoVmCollection: (() => ({ vms })) as unknown as typeof useXoVmCollection,
}))

beforeEach(() => {
  vdf.enabled = false
  vdf.policy = undefined
  vdf.error = undefined
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

  it('highlights the firewall tags like the special tags', () => {
    const wrapper = mountTagsEditor(createVm({ tags: ['production', 'vdf:app', 'vdf:quarantine'] }))

    expect(
      findVmTags(wrapper)
        .filter(tag => tag.classes('accent--warning'))
        .map(tag => tag.text())
    ).toEqual(['vdf:app', 'vdf:quarantine'])
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

describe('firewall tags', () => {
  it('asks for a confirmation before adding a firewall tag', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await searchTag(wrapper, 'vdf:app')
    await clickTagOption(wrapper, 'vdf:app')

    expect(findModalTexts(wrapper)).toEqual({
      title: t('vm-tag:add-firewall-tag?', { tag: 'vdf:app' }),
      content: t('vm-tag:firewall-tag-description', { tag: 'vdf:app' }),
      confirm: t('action:add-tag'),
    })
    expect(put).not.toHaveBeenCalled()
  })

  it('asks for a confirmation before removing a firewall tag, and removes it once confirmed', async () => {
    const wrapper = mountTagsEditor(createVm({ id: 'vm-42' as FrontXoVm['id'], tags: ['vdf:app'] }))

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'vdf:app')

    expect(findModalTexts(wrapper)).toEqual({
      title: t('vm-tag:remove-firewall-tag?', { tag: 'vdf:app' }),
      content: t('vm-tag:firewall-tag-description', { tag: 'vdf:app' }),
      confirm: t('action:remove-tag'),
    })

    await confirmModal(wrapper)

    expect(remove).toHaveBeenCalledWith(`vms/vm-42/tags/${encodeURIComponent('vdf:app')}`)
  })

  it('warns that adding the quarantine tag cuts the VM off from the network', async () => {
    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await searchTag(wrapper, 'vdf:quarantine')
    await clickTagOption(wrapper, 'vdf:quarantine')

    expect(findModalTexts(wrapper)).toEqual({
      title: t('vm-tag:quarantine-vm?'),
      content: t('vm-tag:quarantine-add-description', { tag: 'vdf:quarantine' }),
      confirm: t('action:add-tag'),
    })
  })

  it('warns that removing the quarantine tag lifts the quarantine', async () => {
    const wrapper = mountTagsEditor(createVm({ id: 'vm-42' as FrontXoVm['id'], tags: ['vdf:quarantine'] }))

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'vdf:quarantine')

    expect(findModalTexts(wrapper)).toEqual({
      title: t('vm-tag:lift-quarantine?'),
      content: t('vm-tag:quarantine-remove-description', { tag: 'vdf:quarantine' }),
      confirm: t('action:remove-tag'),
    })
  })
})

describe('refused tag changes', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('shows the reason given by the server', async () => {
    const reason =
      'the tag "vdf:role=app" belongs to the firewall: adding it takes the firewall membership privilege on the pool, the administrate permission on it, or an XO administrator'
    put.mockRejectedValue(
      new ApiError('Forbidden', { status: 403, cause: { error: 'forbidden operation: x', data: { reason } } })
    )

    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'db')

    expect(findModalTexts(wrapper)).toMatchObject({
      title: t('vm-tag:add-failed', { tag: 'db' }),
      content: reason,
      confirm: t('action:close'),
    })
  })

  it('shows the error message when the server gives no reason', async () => {
    remove.mockRejectedValue(new Error('Network down'))

    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'web')

    expect(findModalTexts(wrapper)).toMatchObject({
      title: t('vm-tag:remove-failed', { tag: 'web' }),
      content: 'Network down',
    })
  })

  it('closes the error', async () => {
    put.mockRejectedValue(new Error('Network down'))

    const wrapper = mountTagsEditor()

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'db')
    await confirmModal(wrapper)

    expect(findModalTexts(wrapper)).toBeUndefined()
  })
})

// what locks a firewall tag, per tag and per direction: the right it takes on the VM's pool
const lockText = (change: 'add' | 'remove', right: VdfFirewallAction) =>
  t(`vm-tag:firewall-tag-locked:${change}`, { right: t(`firewall:right:${right}`) })

describe('firewall tags and the firewall rights', () => {
  const CHANGES = {
    'join a group': ['vdf:role=app', 'add'],
    'leave a group': ['vdf:role=app', 'remove'],
    quarantine: ['vdf:quarantine', 'add'],
    lift: ['vdf:quarantine', 'remove'],
    'add a network tag': ['vdf:net=dmz', 'add'],
  } as const

  type Change = keyof typeof CHANGES

  // who may do which change: the others are locked with the right they lack
  const EXPECTED: [string, FirewallRights | 'forbidden', Partial<Record<Change, VdfFirewallAction>>][] = [
    ['an XO administrator', ALL_RIGHTS, {}],
    ['the Firewall administrator role', ALL_RIGHTS, {}],
    [
      'the Firewall operator role',
      OPERATOR_RIGHTS,
      { 'join a group': 'membership', 'leave a group': 'membership', 'add a network tag': 'membership' },
    ],
    [
      'membership only',
      { membership: true },
      { quarantine: 'quarantine:add', lift: 'quarantine:remove', 'add a network tag': 'publish' },
    ],
    [
      'no right on the firewall',
      'forbidden',
      {
        'join a group': 'membership',
        'leave a group': 'membership',
        quarantine: 'quarantine:add',
        lift: 'quarantine:remove',
        'add a network tag': 'membership',
      },
    ],
  ]

  for (const [who, rights, locked] of EXPECTED) {
    it(`locks for ${who} only the changes their rights don't allow`, () => {
      setRights(rights)

      const { wrapper } = mountComposable(() => useVmReservedTags(vm))

      for (const [name, [tag, change]] of Object.entries(CHANGES)) {
        const right = locked[name as Change]

        expect(wrapper.vm.getTagLock(tag, change), name).toBe(right === undefined ? undefined : lockText(change, right))
      }

      expect(wrapper.vm.getTagLock('production', 'remove')).toBeUndefined()
    })
  }

  it('locks nothing while the rights are not known, or when the firewall is not enabled', () => {
    vdf.enabled = true

    const { wrapper } = mountComposable(() => useVmReservedTags(vm))

    expect(wrapper.vm.getTagLock('vdf:role=app', 'add')).toBeUndefined()

    vdf.enabled = false
    setRights('forbidden')
    vdf.enabled = false

    const { wrapper: disabled } = mountComposable(() => useVmReservedTags(vm))

    expect(disabled.vm.getTagLock('vdf:role=app', 'add')).toBeUndefined()
  })

  it('reads an older plugin, without rights: canEdit false locks every firewall tag', () => {
    vdf.enabled = true
    vdf.policy = { canEdit: false }

    const { wrapper } = mountComposable(() => useVmReservedTags(vm))

    expect(wrapper.vm.getTagLock('vdf:quarantine', 'add')).toBe(lockText('add', 'quarantine:add'))
    expect(wrapper.vm.getTagLock('vdf:role=app', 'remove')).toBe(lockText('remove', 'membership'))
  })
})

describe('firewall tags, for a Firewall operator', () => {
  const vdfVm = createVm({ id: 'vm-42' as FrontXoVm['id'], tags: ['production', 'vdf:app'] })

  beforeEach(() => {
    setRights(OPERATOR_RIGHTS)
  })

  it('shows the group tags, with the right they take in a tooltip', async () => {
    const wrapper = mountTagsEditor(vdfVm)

    const tags = findVmTags(wrapper)

    expect(tags.map(tag => tag.text())).toEqual(['production', 'vdf:app'])
    expect(await findTooltipContent(tags[1].element)).toBe(lockText('remove', 'membership'))
    expect(await findTooltipContent(tags[0].element)).toBeFalsy()
  })

  it('keeps the group tags of the VM checked and cannot uncheck them', async () => {
    const wrapper = mountTagsEditor(vdfVm)

    await openTagSelect(wrapper)

    expect(findCheckedTagOptions(wrapper)).toEqual(['production', 'vdf:app'])

    await clickTagOption(wrapper, 'vdf:app')

    expect(findModalTexts(wrapper)).toBeUndefined()
    expect(remove).not.toHaveBeenCalled()
  })

  it('does not suggest the group tags of the other VMs, nor create one', async () => {
    const wrapper = mountTagsEditor(vdfVm, [['production', 'vdf:db']])

    await openTagSelect(wrapper)

    expect(findTagOptions(wrapper).map(([tag]) => tag)).not.toContain('vdf:db')

    await searchTag(wrapper, 'vdf:db')
    await clickTagOption(wrapper, 'vdf:db')

    expect(findModalTexts(wrapper)).toBeUndefined()
    expect(put).not.toHaveBeenCalled()
  })

  it('keeps the group tags when deselecting all the tags', async () => {
    const wrapper = mountTagsEditor(vdfVm)

    await openTagSelect(wrapper)
    await getButton(wrapper, t('action:deselect-all')).trigger('click')
    await settle()

    expect(remove.mock.calls).toEqual([['vms/vm-42/tags/production']])
    expect(findModalTexts(wrapper)).toBeUndefined()
  })

  it('does not add the group tags when selecting all the tags', async () => {
    const wrapper = mountTagsEditor(createVm({ id: 'vm-42' as FrontXoVm['id'], tags: [] }), [['db', 'vdf:db']])

    await openTagSelect(wrapper)
    await getButton(wrapper, t('action:select-all')).trigger('click')
    await settle()

    expect(put.mock.calls).toEqual([['vms/vm-42/tags/db']])
  })

  it('still lets the other tags be changed', async () => {
    const wrapper = mountTagsEditor(vdfVm)

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'production')

    expect(remove).toHaveBeenCalledWith('vms/vm-42/tags/production')
  })

  it('quarantines the VM: suggests the quarantine tag, and adds it once confirmed', async () => {
    const wrapper = mountTagsEditor(vdfVm, [['vdf:quarantine']])

    await openTagSelect(wrapper)

    expect(findTagOptions(wrapper).map(([tag]) => tag)).toContain('vdf:quarantine')

    await clickTagOption(wrapper, 'vdf:quarantine')

    expect(findModalTexts(wrapper)?.title).toBe(t('vm-tag:quarantine-vm?'))

    await confirmModal(wrapper)

    expect(put).toHaveBeenCalledWith(`vms/vm-42/tags/${encodeURIComponent('vdf:quarantine')}`)
  })

  it("lifts the VM's quarantine once confirmed", async () => {
    const wrapper = mountTagsEditor(createVm({ id: 'vm-42' as FrontXoVm['id'], tags: ['vdf:quarantine', 'vdf:app'] }))

    expect(await findTooltipContent(findVmTags(wrapper)[0].element)).toBeFalsy()

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'vdf:quarantine')

    expect(findModalTexts(wrapper)?.title).toBe(t('vm-tag:lift-quarantine?'))

    await confirmModal(wrapper)

    expect(remove).toHaveBeenCalledWith(`vms/vm-42/tags/${encodeURIComponent('vdf:quarantine')}`)
  })
})

describe('firewall tags, one way only', () => {
  it('quarantine:add only: quarantines, but cannot lift a quarantine', async () => {
    setRights({ read: true, 'quarantine:add': true })

    const wrapper = mountTagsEditor(createVm({ id: 'vm-42' as FrontXoVm['id'], tags: ['vdf:quarantine'] }))

    expect(await findTooltipContent(findVmTags(wrapper)[0].element)).toBe(lockText('remove', 'quarantine:remove'))

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'vdf:quarantine')

    expect(findModalTexts(wrapper)).toBeUndefined()
    expect(remove).not.toHaveBeenCalled()
  })

  it('quarantine:remove only: lifts a quarantine, but cannot quarantine', async () => {
    setRights({ read: true, 'quarantine:remove': true })

    const wrapper = mountTagsEditor(createVm({ id: 'vm-42' as FrontXoVm['id'], tags: [] }), [['vdf:quarantine']])

    await openTagSelect(wrapper)

    expect(findTagOptions(wrapper).map(([tag]) => tag)).not.toContain('vdf:quarantine')

    await searchTag(wrapper, 'vdf:quarantine')
    await clickTagOption(wrapper, 'vdf:quarantine')

    expect(findModalTexts(wrapper)).toBeUndefined()
    expect(put).not.toHaveBeenCalled()
  })

  it('offers the firewall tags when the user has every right', async () => {
    setRights(ALL_RIGHTS)

    const wrapper = mountTagsEditor(createVm({ id: 'vm-42' as FrontXoVm['id'], tags: ['vdf:app'] }), [['vdf:db']])

    await openTagSelect(wrapper)

    expect(findTagOptions(wrapper).map(([tag]) => tag)).toContain('vdf:db')
    expect(await findTooltipContent(findVmTags(wrapper)[0].element)).toBeFalsy()
  })

  it('offers the firewall tags when the firewall is not enabled', async () => {
    const wrapper = mountTagsEditor(createVm({ id: 'vm-42' as FrontXoVm['id'], tags: ['vdf:app'] }), [['vdf:db']])

    await openTagSelect(wrapper)

    expect(findTagOptions(wrapper).map(([tag]) => tag)).toContain('vdf:db')
  })
})
