import VmTagsEditor from '@/modules/vm/components/tags/VmTagsEditor.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { fetchDelete, fetchPut } from '@/shared/utils/fetch.util.ts'
import { createVm } from '@/test/create-vm.ts'
import { findTags } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { vmCollectionMock, mockXoVmCollection } from '@/test/mock-xo-vm-collection.ts'
import { mockedExport } from '@/test/spy-on-module.ts'
import VtsTagSelect, { type TagSelectChanges } from '@core/components/tag-select/VtsTagSelect.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { findTagProps } from '@core-test/find-accented-labels.ts'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'

const put = mockedExport(fetchPut)
const remove = mockedExport(fetchDelete)

mockXoVmCollection()

beforeEach(() => {
  vmCollectionMock.reset()
  put.mockResolvedValue(undefined)
  remove.mockResolvedValue(undefined)
})

const vm = createVm({ id: 'vm-42' as FrontXoVm['id'], tags: ['web', 'production'] })

function mountTagsEditor({
  editedVm = vm,
  otherVmsTags = [['production', 'db']],
  iconOnly = false,
}: { editedVm?: FrontXoVm; otherVmsTags?: string[][]; iconOnly?: boolean } = {}) {
  vmCollectionMock.vms.value = [editedVm, ...otherVmsTags.map(tags => createVm({ tags }))]

  return mount(VmTagsEditor, {
    props: { vm: editedVm, iconOnly },
    global: createGlobalTestConfig(),
  })
}

function findTagSelect(wrapper: VueWrapper) {
  return wrapper.getComponent(VtsTagSelect)
}

async function saveTags(wrapper: VueWrapper, changes: TagSelectChanges) {
  findTagSelect(wrapper).vm.$emit('save', changes)
  await flushPromises()
}

describe('tags of the VM', () => {
  it('lists the tags of the VM in alphabetical order', () => {
    const wrapper = mountTagsEditor()

    expect(findTags(wrapper)).toEqual(['production', 'web'])
  })

  it.each([
    ['displays the tags of the VM with the brand accent', 'accent', ['brand', 'brand']],
    ['does not offer to remove the tags outside of the tag select', 'removable', [false, false]],
  ] as const)('%s', (_, prop, values) => {
    const wrapper = mountTagsEditor()

    expect(findTagProps(wrapper.getComponent(UiTagsList), prop)).toEqual(values)
  })

  it('lists no tag when the VM has none', () => {
    const wrapper = mountTagsEditor({ editedVm: createVm({ tags: [] }) })

    expect(wrapper.findComponent(UiTagsList).exists()).toBe(false)
  })
})

describe('tag select', () => {
  it('edits the tags of the VM', () => {
    const wrapper = mountTagsEditor()

    expect(findTagSelect(wrapper).props('tags')).toEqual(['web', 'production'])
  })

  it('suggests the tags of all the VMs, with the number of VMs using each', () => {
    const wrapper = mountTagsEditor({ otherVmsTags: [['production', 'db'], ['analytics']] })

    expect(findTagSelect(wrapper).props('suggestions')).toEqual([
      { tag: 'web', info: t('n-vms', 1) },
      { tag: 'production', info: t('n-vms', 2) },
      { tag: 'db', info: t('n-vms', 1) },
      { tag: 'analytics', info: t('n-vms', 1) },
    ])
  })

  it.each([false, true])('passes the icon-only mode on to the tag select (%s)', iconOnly => {
    const wrapper = mountTagsEditor({ iconOnly })

    expect(findTagSelect(wrapper).props('iconOnly')).toBe(iconOnly)
  })
})

describe('saving the tags', () => {
  it('adds and removes the tags saved from the tag select', async () => {
    const wrapper = mountTagsEditor()

    await saveTags(wrapper, { added: ['db'], removed: ['web'] })

    expect(put.mock.calls).toEqual([['vms/vm-42/tags/db']])
    expect(remove.mock.calls).toEqual([['vms/vm-42/tags/web']])
  })

  it('marks the tag select as busy until the tags are saved', async () => {
    let resolvePut = () => {}

    put.mockReturnValue(
      new Promise<void>(resolve => {
        resolvePut = resolve
      })
    )

    const wrapper = mountTagsEditor()

    expect(findTagSelect(wrapper).props('busy')).toBe(false)

    await saveTags(wrapper, { added: ['db'], removed: [] })

    expect(findTagSelect(wrapper).props('busy')).toBe(true)

    resolvePut()
    await flushPromises()

    expect(findTagSelect(wrapper).props('busy')).toBe(false)
  })
})
