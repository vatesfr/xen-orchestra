<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('isOpen').bool().help('Controls drawer visibility'),
      prop('dismissible').bool().widget().help('Allow closing via backdrop click, dismiss button and Escape key'),
      prop('current').bool().widget().help('Only the current (topmost) drawer reacts to Escape'),
      event('dismiss').help('Emitted when the drawer is dismissed'),
      slot('title').help('Drawer title'),
      slot('content').help('Main content area'),
      slot('buttons').help('Footer buttons area (wrapped in VtsButtonGroup)'),
      setting('showForm').widget(boolean()).preset(false).help('Show a form example inside content'),
    ]"
    :presets="{
      Default: {
        props: { isOpen: true, dismissible: true, current: true },
      },
      'With form': {
        props: { isOpen: true, dismissible: true, current: true },
        settings: { showForm: true },
      },
    }"
  >
    <UiButton variant="primary" accent="brand" size="medium" @click="isOpen = true">Open Drawer</UiButton>

    <VtsDrawer
      :is-open="isOpen"
      :dismissible="properties.dismissible"
      :current="properties.current"
      @dismiss="handleDismiss()"
    >
      <template #title>Drawer Title</template>
      <template #content>
        <form v-if="settings.showForm" class="form" @submit.prevent="handleSubmit()">
          <VtsInputWrapper
            label="Name"
            :message="isNameEmpty ? { content: 'Name is required', accent: 'danger' } : undefined"
          >
            <UiInput v-model.trim="form.name" required :accent="isNameEmpty ? 'danger' : 'brand'" />
          </VtsInputWrapper>
          <VtsInputWrapper label="Description">
            <UiInput v-model="form.description" accent="brand" />
          </VtsInputWrapper>
          <div class="actions">
            <UiButton variant="secondary" accent="brand" size="medium" @click="handleDismiss()">Cancel</UiButton>
            <UiButton variant="primary" accent="brand" size="medium" type="submit" :disabled="isNameEmpty">
              Save
            </UiButton>
          </div>
        </form>
        <p v-else>This is the drawer content.</p>
      </template>
      <template v-if="!settings.showForm" #buttons>
        <UiButton
          v-if="properties.dismissible"
          variant="secondary"
          accent="brand"
          size="medium"
          @click="handleDismiss()"
        >
          Cancel
        </UiButton>
        <UiButton variant="primary" accent="brand" size="medium" @click="handleDismiss()">Confirm</UiButton>
      </template>
    </VtsDrawer>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, prop, setting, slot } from '@/libs/story/story-param'
import { boolean } from '@/libs/story/story-widget'
import VtsDrawer from '@core/components/drawer/VtsDrawer.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { computed, reactive, ref } from 'vue'

const isOpen = ref(false)

const form = reactive({
  name: '',
  description: '',
})

const isNameEmpty = computed(() => form.name.trim() === '')

function handleSubmit() {
  if (isNameEmpty.value) {
    return
  }

  resetForm()
}

function handleDismiss() {
  resetForm()
}

function resetForm() {
  isOpen.value = false
  form.name = ''
  form.description = ''
}
</script>

<style lang="postcss" scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  width: 100%;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
  margin-top: 1.6rem;
}
</style>
