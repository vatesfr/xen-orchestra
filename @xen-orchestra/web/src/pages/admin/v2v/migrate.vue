<template>
  <V2vMigrationWizard />
</template>

<script lang="ts" setup>
import V2vMigrationWizard from '@/modules/v2v/components/wizard/V2vMigrationWizard.vue'
import { provideV2vConnection } from '@/modules/v2v/composables/use-v2v-connection.composable.ts'

provideV2vConnection()
</script>
