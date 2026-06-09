<template>
  <VtsForm class="new-sr-form">
    <NewSrFormTextInput v-bind="nameInputBindings" />
    <NewSrFormTextInput v-bind="descriptionInputBindings" />
  </VtsForm>
</template>

<script setup lang="ts">
import NewSrFormTextInput from '@/modules/storage-repository/components/form/new/inputs/NewSrFormTextInput.vue'
import { useNewSrForm } from '@/modules/storage-repository/form/new/use-new-sr-form.ts'
import VtsForm from '@core/components/form/VtsForm.vue'

const { nameInputBindings, descriptionInputBindings, validate } = useNewSrForm()

defineExpose({ validate })
</script>
