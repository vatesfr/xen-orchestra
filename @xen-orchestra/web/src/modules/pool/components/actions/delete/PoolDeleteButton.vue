<template>
  <UiButton
    v-tooltip="!canRun ? errorMessage : undefined"
    left-icon="action:delete"
    variant="tertiary"
    accent="danger"
    size="medium"
    :disabled="!canRun"
    :busy="isRunning"
    @click="handleRemove()"
  >
    {{ t('action:delete') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useXoServerRemoveJob } from '@/modules/server/jobs/xo-server-remove.job.ts'
import type { FrontXoServer } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { serverId } = defineProps<{ serverId: FrontXoServer['id'] }>()

const { t } = useI18n()

const serverIdArg = computed(() => serverId)

const { isRunning, canRun, errorMessage, run: remove } = useXoServerRemoveJob([serverIdArg])

async function handleRemove() {
  try {
    await remove()
  } catch (error) {
    console.error('Error when removing server:', error)
  }
}
</script>
