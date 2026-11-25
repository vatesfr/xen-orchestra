<template>
  <UiDrawer class="pool-new-host-drawer" @confirm="emit('confirm')" @dismiss="emit('cancel')">
    <template #title>
      {{ t('new-host') }}
    </template>

    <template #content>
      <div class="content">
        <FormTextInput v-bind="hostInputBindings" />
        <div class="credentials">
          <FormTextInput v-bind="usernameInputBindings" />
          <FormPasswordInput v-bind="passwordInputBindings" />
        </div>
        <FormCheckbox v-bind="allowUnauthorizedCheckboxBindings" />
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />

      <VtsOverlayConfirmButton>
        {{ t('action:add-host') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import FormCheckbox from '@/shared/components/form/FormCheckbox.vue'
import FormPasswordInput from '@/shared/components/form/FormPasswordInput.vue'
import FormTextInput from '@/shared/components/form/FormTextInput.vue'
import type { FieldMetadata, ModelBinding } from '@core/packages/validated-form'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  hostInputBindings: ModelBinding<string> &
    FieldMetadata & { label: string; required: boolean; placeholder: string; info: string }
  usernameInputBindings: ModelBinding<string> & FieldMetadata & { label: string; required: boolean; info: string }
  passwordInputBindings: ModelBinding<string> & FieldMetadata & { label: string; required: boolean }
  allowUnauthorizedCheckboxBindings: ModelBinding<boolean> & FieldMetadata & { label: string }
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.pool-new-host-drawer {
  .content {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
    text-align: left;
  }

  .credentials {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2.4rem;

    @media (--small) {
      grid-template-columns: minmax(0, 1fr);
    }
  }
}
</style>
