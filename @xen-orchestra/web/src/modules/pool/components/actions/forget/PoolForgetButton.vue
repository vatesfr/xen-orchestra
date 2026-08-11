<template>
  <UiButton
    v-tooltip="!canRemoveServer ? removeServerErrorMessage : undefined"
    left-icon="action:forget"
    variant="tertiary"
    accent="danger"
    size="medium"
    :disabled="!canRemoveServer"
    :busy="isRemovingServer"
    @click="removeServer()"
  >
    {{ t('action:forget') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useServerForget } from '@/modules/server/composables/use-server-forget-modal.composable.ts'
import { type FrontXoServer } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

const { server } = defineProps<{ server: FrontXoServer }>()

const { t } = useI18n()

const { removeServer, canRemoveServer, isRemovingServer, removeServerErrorMessage } = useServerForget(
  () => server.id,
  () => server.label
)
</script>
