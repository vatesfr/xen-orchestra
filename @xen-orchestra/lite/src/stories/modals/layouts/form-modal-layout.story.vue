<template>
  <ComponentStory :params>
    <FormModalLayout v-bind="bindings">
      <template #title>{{ settings.titleSlot }}</template>

      <div>
        <FormInputWrapper label="Select a destination host" learn-more-url="http://..." light>
          <FormInput />
        </FormInputWrapper>

        <FormInputWrapper label="Select a migration network (optional)" learn-more-url="http://..." light>
          <FormInput />
        </FormInputWrapper>

        <FormInputWrapper
          help="Individual selection for each VDI is not available on multiple VMs migration."
          label="Select a destination SR"
          learn-more-url="http://..."
          light
        >
          <FormInput />
        </FormInputWrapper>
      </div>

      <template #buttons>
        <UiButton accent="brand" size="medium" variant="secondary">Cancel</UiButton>
        <UiButton accent="brand" size="medium" variant="primary">Migrate 3 VMs</UiButton>
      </template>
    </FormModalLayout>
  </ComponentStory>
</template>

<script lang="ts" setup>
import FormInput from '@/components/form/FormInput.vue'
import FormInputWrapper from '@/components/form/FormInputWrapper.vue'
import FormModalLayout from '@/components/ui/modals/layouts/FormModalLayout.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import { faDesktop } from '@fortawesome/free-solid-svg-icons'

const { params, bindings, settings } = useStory({
  props: {
    icon: {
      preset: faDesktop,
      type: 'IconDefinition',
      widget: iconChoice(),
    },
  },
  slots: {
    title: {},
    default: {},
    buttons: {},
  },
  settings: {
    titleSlot: {
      preset: 'Migrate 3 VMs',
    },
  },
})
</script>
