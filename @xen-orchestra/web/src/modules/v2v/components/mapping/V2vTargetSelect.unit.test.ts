import V2vTargetSelect from '@/modules/v2v/components/mapping/V2vTargetSelect.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { openSelect, pickSelectOption } from '@/test/select.ts'
import { V2V_SSD_SR, V2V_TARGET_OPTIONS } from '@/test/v2v-mapping-fixtures.ts'
import { mount } from '@vue/test-utils'

it('emits the id of the target picked', async () => {
  const wrapper = mount(V2vTargetSelect, {
    props: { options: V2V_TARGET_OPTIONS.srs, modelValue: V2V_TARGET_OPTIONS.srs[0].id },
    global: createGlobalTestConfig(),
  })

  await openSelect(wrapper)
  await pickSelectOption(wrapper, V2V_SSD_SR.name_label)

  expect(wrapper.emitted('update:modelValue')).toEqual([[V2V_SSD_SR.id]])
})
