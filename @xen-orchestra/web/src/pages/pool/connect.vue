<template>
  <PoolConnectionHeader />
  <UiCard class="pool-connect-card" :class="{ 'full-height': success || hasError }">
    <PoolConnectionSuccess v-if="success && serverId" :ip :server-id @connect-another-pool="reset()" />
    <PoolConnectionError v-else-if="hasError && error" :ip :error @go-back="reset()" />
    <PoolConnectionForm v-else @success="handleSuccess" @error="handleError" />
  </UiCard>
</template>

<script setup lang="ts">
import PoolConnectionError from '@/modules/pool/components/connection/PoolConnectionError.vue'
import PoolConnectionForm from '@/modules/pool/components/connection/PoolConnectionForm.vue'
import PoolConnectionHeader from '@/modules/pool/components/connection/PoolConnectionHeader.vue'
import PoolConnectionSuccess from '@/modules/pool/components/connection/PoolConnectionSuccess.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import type { XoServer } from '@vates/types'
import { ref } from 'vue'

const success = ref(false)
const hasError = ref(false)
const serverId = ref<XoServer['id']>()
const error = ref<Error>()
const ip = ref<string>()

function handleSuccess(_serverId: XoServer['id'], _ip?: string) {
  success.value = true
  serverId.value = _serverId
  ip.value = _ip
}

function handleError(_error: Error, _ip?: string) {
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

  &.full-height {
    height: 100%;
  }
}
</style>
