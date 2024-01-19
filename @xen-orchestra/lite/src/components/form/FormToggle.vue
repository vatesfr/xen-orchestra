<template>
  <FormCheckbox />
</template>

<script lang="ts" setup>
import FormCheckbox from '@/components/form/FormCheckbox.vue'
import { IK_CHECKBOX_TYPE } from '@/types/injection-keys'
import { provide } from 'vue'

provide(IK_CHECKBOX_TYPE, 'toggle')
</script>
