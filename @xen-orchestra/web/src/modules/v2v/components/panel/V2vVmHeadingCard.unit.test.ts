import V2vVmHeadingCard from '@/modules/v2v/components/panel/V2vVmHeadingCard.vue'
import type { V2vMappingVmHeading } from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import { createV2vNewMappingStepVm } from '@/test/create-v2v-mapping-step-vm.ts'
import { createV2vMappingVmHeading } from '@/test/create-v2v-mapping-vm-heading.ts'
import { findAccentedTags } from '@/test/find-accented-labels.ts'
import { findParts } from '@/test/find-parts.ts'
import { findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import type { XoV2vVm } from '@vates/types'
import { mount } from '@vue/test-utils'

const VM = createV2vNewMappingStepVm()

function mountCard({ id = VM.id, heading = VM.heading }: { id?: XoV2vVm['id']; heading?: V2vMappingVmHeading } = {}) {
  return mount(V2vVmHeadingCard, { props: { id, heading }, global: createGlobalTestConfig() })
}

it('titles the card with a VM icon, the name of the VM and its copyable id, without a link', () => {
  const title = mountCard().getComponent(UiPanelCardTitle)

  expect(title.props()).toMatchObject({ label: VM.heading.name, id: VM.id, icon: 'object:vm', to: undefined })
})

it('tags the VM with its status, then locates it on the source', () => {
  const wrapper = mountCard()

  expect(Object.keys(findCardLabelledValues(wrapper))).toEqual([t('status'), t('location')])
  expect(findAccentedTags(wrapper)).toEqual([VM.heading.statusTag])
  expect(findParts(wrapper, '.inline-parts')).toEqual(VM.heading.locationParts)
})

it('leaves out the status of a VM without one', () => {
  const wrapper = mountCard({ heading: createV2vMappingVmHeading({ statusTag: undefined }) })

  expect(Object.keys(findCardLabelledValues(wrapper))).toEqual([t('location')])
  expect(findAccentedTags(wrapper)).toEqual([])
})
