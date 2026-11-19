<template>
  <VtsForgetButton
    :hint="forgetServerErrorMessage"
    :disabled="!canForgetServer"
    :busy="isForgettingServer"
    @click="forgetServer()"
  />
</template>

<script lang="ts" setup>
import { useServerForget } from '@/modules/server/composables/use-server-forget.composable.ts'
import { type FrontXoServer } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import VtsForgetButton from '@core/components/forget-button/VtsForgetButton.vue'

const { server } = defineProps<{ server: FrontXoServer }>()

const { forgetServer, canForgetServer, isForgettingServer, forgetServerErrorMessage } = useServerForget(
  () => server.id,
  () => server.label
)
</script>
