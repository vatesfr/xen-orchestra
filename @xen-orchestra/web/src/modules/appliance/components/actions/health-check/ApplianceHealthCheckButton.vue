<template>
  <UiButton
    :busy="isCheckingHealth"
    accent="brand"
    left-icon="action:health-check"
    size="small"
    variant="secondary"
    @click="runHealthCheck({ detached: true, onSuccess: () => reloadHealthCheck() })"
  >
    {{ t('action:run-health-check') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useXoaHealthCheckJob } from '@/modules/appliance/jobs/xoa-health-check.job.ts'
import { useXoaHealthCheck } from '@/modules/appliance/remote-resources/use-xoa-health-check.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { reloadHealthCheck } = useXoaHealthCheck()

const { run: runHealthCheck, isRunning: isCheckingHealth } = useXoaHealthCheckJob()
</script>
