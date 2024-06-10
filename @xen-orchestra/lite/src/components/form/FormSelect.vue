<template>
  <FormInput>
    <slot />
  </FormInput>
</template>

<script lang="ts" setup>
import FormInput from '@/components/form/FormInput.vue'
import { IK_INPUT_TYPE } from '@/types/injection-keys'
import { provide } from 'vue'

provide(IK_INPUT_TYPE, 'select')
</script>
