<template>
  <ConnectPoolHeader />
  <UiCard class="pool-connect-card">
    <ConnectionSuccess v-if="success && serverId" :ip :server-id @connect-another-pool="reset()" />
    <ConnectionError v-else-if="hasError && error" :ip :error @go-back="reset()" />
    <ConnectionForm v-else @success="handleSuccess" @error="handleError" />
  </UiCard>
</template>

<script setup lang="ts">
import ConnectionError from '@/components/pool/connect/ConnectionError.vue'
import ConnectionForm from '@/components/pool/connect/ConnectionForm.vue'
import ConnectionSuccess from '@/components/pool/connect/ConnectionSuccess.vue'
import ConnectPoolHeader from '@/components/pool/connect/ConnectPoolHeader.vue'
import { ApiError } from '@/error/api.error.ts'
import type { XoServer } from '@/types/xo/server.type.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { ref } from 'vue'

const success = ref(false)
const hasError = ref(false)
const serverId = ref<XoServer['id']>()
const error = ref<ApiError>()
const ip = ref<string>()

function handleSuccess(_serverId: XoServer['id'], _ip?: string) {
  success.value = true
  serverId.value = _serverId
  ip.value = _ip
}

function handleError(_error: ApiError, _ip?: string) {
  hasError.value = true
  error.value = _error
  ip.value = _ip
}

function reset() {
  serverId.value = undefined
  ip.value = undefined
  success.value = false
  hasError.value = false
}
</script>

<style lang="postcss" scoped>
.pool-connect-card {
  margin: 0.8rem;
}
</style>
