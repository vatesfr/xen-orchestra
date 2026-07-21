<template>
  <UiButton
    v-tooltip="!canRun ? errorMessage : undefined"
    left-icon="action:delete"
    variant="tertiary"
    accent="danger"
    size="medium"
    :disabled="!canRun"
    :busy="isRunning"
    @click="openModal()"
  >
    {{ t('action:delete') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useServerRemoveModal } from '@/modules/server/composables/use-xo-server-remove-modal.composable.ts'
import { useXoServerCollection } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import type { FrontXoServer } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { serverId } = defineProps<{ serverId: FrontXoServer['id'] }>()
const { t } = useI18n()

const { servers } = useXoServerCollection()
const serverLabel = computed(() => servers.value.find(s => s.id === serverId)?.label ?? '')

const { openModal, canRun, isRunning, errorMessage } = useServerRemoveModal(() => serverId, serverLabel)
</script>
