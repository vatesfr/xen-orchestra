<template>
  <ComponentStory v-slot="{ properties }" :params="[iconProp(), slot('title'), slot('default'), slot('buttons')]">
    <FormModalLayout :icon="faRoute" v-bind="properties">
      <template #title>Migrate 3 VMs</template>

      <div class="inputs">
        <VtsInputWrapper label="Select a destination host" learn-more-url="http://...">
          <FormInput />
        </VtsInputWrapper>

        <VtsInputWrapper label="Select a migration network (optional)" learn-more-url="http://...">
          <FormInput />
        </VtsInputWrapper>

        <VtsInputWrapper
          message="Individual selection for each VDI is not available on multiple VMs migration."
          label="Select a destination SR"
          learn-more-url="http://..."
        >
          <FormInput />
        </VtsInputWrapper>
      </div>

      <template #buttons>
        <UiButton variant="secondary" accent="brand" size="medium">Cancel</UiButton>
        <UiButton variant="primary" accent="brand" size="medium">Migrate 3 VMs</UiButton>
      </template>
    </FormModalLayout>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormModalLayout from '@/components/ui/modals/layouts/FormModalLayout.vue'
import { iconProp, slot } from '@/libs/story/story-param'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { faRoute } from '@fortawesome/free-solid-svg-icons'
</script>

<style lang="postcss" scoped>
.inputs {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
