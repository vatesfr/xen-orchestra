import V2vValueOrigin from '@/modules/v2v/components/mapping/V2vValueOrigin.vue'
import V2vVmOptionsFields from '@/modules/v2v/components/mapping/V2vVmOptionsFields.vue'
import { findAccentedInfos } from '@/test/find-accented-labels.ts'
import { getButton } from '@/test/get-button.ts'
import { getCheckbox } from '@/test/get-checkbox.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { V2V_DEBIAN_TEMPLATE, V2V_TARGET_OPTIONS, createV2vOfferedTarget } from '@/test/v2v-mapping-fixtures.ts'
import { getV2vTargetSelect } from '@/test/v2v-target-cells.ts'
import VtsTagsInput from '@core/components/tags-input/VtsTagsInput.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import { V2V_PARTIAL_IMPORT_TAG } from '@vates/types'
import { mount } from '@vue/test-utils'

const TEMPLATE = createV2vOfferedTarget(V2V_DEBIAN_TEMPLATE.id, 'overridden')

const TAGS = ['migrated-from:vmware', 'web']

function mountFields(keepMac = true) {
  return mount(V2vVmOptionsFields, {
    props: {
      keepMac,
      template: TEMPLATE,
      templateOptions: V2V_TARGET_OPTIONS.templates,
      tags: TAGS,
      loading: true,
    },
    global: createGlobalTestConfig(),
  })
}

describe('keep MAC addresses', () => {
  it('shows whether the MAC addresses are kept', () => {
    expect(mountFields().getComponent(UiCheckbox).props('modelValue')).toBe(true)
  })

  it.each([true, false])('emits the choice of %s', async keepMac => {
    const wrapper = mountFields(!keepMac)

    await getCheckbox(wrapper, t('keep-mac-addresses')).setValue(keepMac)

    expect(wrapper.emitted('changeKeepMac')).toEqual([[keepMac]])
  })
})

describe('template', () => {
  it('shows the template among the offered ones, and where it comes from', () => {
    const wrapper = mountFields()

    expect(getV2vTargetSelect(wrapper).props()).toEqual({
      modelValue: TEMPLATE.value,
      options: V2V_TARGET_OPTIONS.templates,
      loading: true,
    })
    expect(wrapper.getComponent(V2vValueOrigin).props('origin')).toBe(TEMPLATE.origin)
  })

  it('emits the template chosen', () => {
    const wrapper = mountFields()

    getV2vTargetSelect(wrapper).vm.$emit('update:modelValue', V2V_TARGET_OPTIONS.templates[0].id)

    expect(wrapper.emitted('changeTemplate')).toEqual([[V2V_TARGET_OPTIONS.templates[0].id]])
  })

  it('emits the reset of the template', async () => {
    const wrapper = mountFields()

    await getButton(wrapper, t('action:reset-to-default')).trigger('click')

    expect(wrapper.emitted('changeTemplate')).toEqual([[undefined]])
  })
})

describe('tags', () => {
  it('edits the tags of the destination VM', () => {
    expect(mountFields().getComponent(VtsTagsInput).props('modelValue')).toEqual(TAGS)
  })

  it('emits the tags edited', () => {
    const wrapper = mountFields()

    wrapper.getComponent(VtsTagsInput).vm.$emit('update:modelValue', ['web'])

    expect(wrapper.emitted('changeTags')).toEqual([[['web']]])
  })

  it('tells how the tags and the backups go together until the cutover', () => {
    expect(findAccentedInfos(mountFields())).toEqual([
      { label: t('v2v:tags-backup-info', { tag: V2V_PARTIAL_IMPORT_TAG }), accent: 'info' },
    ])
  })
})
