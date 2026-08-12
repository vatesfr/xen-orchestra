<template>
  <UiButton
    v-tooltip="!canForgetServer ? forgetServerErrorMessage : undefined"
    left-icon="action:forget"
    variant="tertiary"
    accent="danger"
    size="medium"
    :disabled="!canForgetServer"
    :busy="isForgettingServer"
    @click="forgetServer()"
  >
    {{ t('action:forget') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useServerForget } from '@/modules/server/composables/use-server-forget.composable.ts'
import { type FrontXoServer } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

const { server } = defineProps<{ server: FrontXoServer }>()

const { t } = useI18n()

const { forgetServer, canForgetServer, isForgettingServer, forgetServerErrorMessage } = useServerForget(
  () => server.id,
  () => server.label
)
</script>
