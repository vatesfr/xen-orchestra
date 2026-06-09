<template>
  <VtsDrawer dismissible :is-open="undefined">
    <template #title>{{ t('action:create-sr') }}</template>
    <template #content>
      <NewStorageRepositoryForm ref="formRef" />
    </template>
    <template #buttons>
      <VtsDrawerCancelButton />
      <VtsDrawerConfirmButton :on-click="handleConfirm">{{ t('action:create') }}</VtsDrawerConfirmButton>
    </template>
  </VtsDrawer>
</template>

<script setup lang="ts">
import NewStorageRepositoryForm from '@/modules/storage-repository/components/form/new/NewStorageRepositoryForm.vue'
import VtsDrawer from '@core/components/drawer/VtsDrawer.vue'
import VtsDrawerCancelButton from '@core/components/drawer/VtsDrawerCancelButton.vue'
import VtsDrawerConfirmButton from '@core/components/drawer/VtsDrawerConfirmButton.vue'
import { IK_DRAWER } from '@core/packages/drawer/types.ts'
import { inject, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const drawer = inject(IK_DRAWER)
const formRef = useTemplateRef('formRef')

async function handleConfirm() {
  const isValid = await formRef.value?.validate()
  if (!isValid) return // stay open, show inline errors

  // Once routes exist: const payload = buildPayload(formData)
  drawer?.value.onConfirm(/* payload */)
}
</script>
