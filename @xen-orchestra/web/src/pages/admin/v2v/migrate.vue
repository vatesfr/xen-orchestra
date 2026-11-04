<template>
  <MigrationWizard />
</template>

<script lang="ts" setup>
import MigrationWizard from '@/modules/v2v/components/wizard/MigrationWizard.vue'
import { provideV2vConnection } from '@/modules/v2v/composables/use-v2v-connection.composable.ts'

provideV2vConnection()
</script>
