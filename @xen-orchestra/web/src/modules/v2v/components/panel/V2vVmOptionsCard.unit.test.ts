import V2vVmOptionsCard from '@/modules/v2v/components/panel/V2vVmOptionsCard.vue'
import { itRendersCardTitle } from '@/test/card-title.ts'
import { getGenericComponent } from '@/test/find-generic-components.ts'
import { findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { findPanelCardTitleLabel } from '@/test/find-titles.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import {
  V2V_DEBIAN_TEMPLATE,
  V2V_MIGRATED_VM_TAGS,
  V2V_TARGET_OPTIONS,
  createV2vOfferedTarget,
} from '@/test/v2v-mapping-fixtures.ts'
import { findTagProps } from '@core-test/find-accented-labels.ts'
import { mount } from '@vue/test-utils'

const TEMPLATE = createV2vOfferedTarget(V2V_DEBIAN_TEMPLATE.id, 'overridden')

function mountCard(props: Partial<InstanceType<typeof V2vVmOptionsCard>['$props']> = {}) {
  return mount(V2vVmOptionsCard, {
    props: {
      keepMac: true,
      template: TEMPLATE,
      templateOptions: V2V_TARGET_OPTIONS.templates,
      tags: V2V_MIGRATED_VM_TAGS,
      ...props,
    },
    global: createGlobalTestConfig(),
  })
}

itRendersCardTitle(mountCard, t('options'), findPanelCardTitleLabel)

it.each([
  [true, 'enabled'],
  [false, 'disabled'],
] as const)('tells whether the MAC addresses are kept (%s)', (keepMac, statusKey) => {
  expect(findCardLabelledValues(mountCard({ keepMac }))[t('keep-mac-addresses')]).toBe(t(statusKey))
})

it('names the template among the offered ones, and where it comes from', () => {
  expect(getGenericComponent(mountCard(), 'V2vTargetValue').props()).toEqual({
    target: TEMPLATE,
    options: V2V_TARGET_OPTIONS.templates,
  })
})

it('lists the tags of the VM', () => {
  expect(findTagProps(mountCard({ tags: ['web', 'prod'] }), 'value')).toEqual(['web', 'prod'])
})

it('lists no tag for a VM without any', () => {
  expect(findTagProps(mountCard({ tags: [] }), 'value')).toEqual([])
})
