<template>
  <UiButton
    left-icon="action:delete"
    variant="secondary"
    accent="danger"
    size="medium"
    :busy="isRunning"
    @click="remove()"
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

const { isRunning, run: remove } = useXoServerRemoveJob([serverIdArg])
</script>
