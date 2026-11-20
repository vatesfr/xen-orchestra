<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('option')
        .required()
        .obj('FormOption<{ accent?: DropdownAccent }>')
        .help('Given by the default slot of VtsSelect'),
      iconProp().preset('object:network'),
      prop('iconTooltip').str().widget(),
      prop('details').str().widget().preset('eth0').help('Displayed after a dash'),
    ]"
    :presets="{
      'PIF with VLAN': {
        props: {
          icon: 'object:network',
          details: 'eth1, VLAN 20',
        },
      },
      'Disabled VM': {
        props: {
          icon: 'object:vm:running',
          iconTooltip: 'Running',
          details: 'No VIF detected',
        },
      },
      'Without details': {
        props: {
          icon: 'object:network',
          details: undefined,
        },
      },
    }"
  >
    <VtsSelect :id="optionSelectId" accent="brand">
      <template #default="{ option }">
        <VtsDetailedOption v-bind="properties" :option />
      </template>
    </VtsSelect>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop } from '@/libs/story/story-param.ts'
import VtsDetailedOption from '@core/components/select/VtsDetailedOption.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useFormSelect } from '@core/packages/form-select'

const optionLabels = ['Pool-wide network associated with eth0', 'Storage network']

const { id: optionSelectId } = useFormSelect(optionLabels)
</script>
