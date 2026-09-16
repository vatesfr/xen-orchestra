<!-- eslint-disable @intlify/vue-i18n/no-raw-text -- POC debug panel, never shipped, so no i18n keys -->
<template>
  <UiCard>
    <UiTitle>POC — XAPI calls from an XO object</UiTitle>
    <p>
      This component only ever receives an <code>XoVm</code>. It holds no opaque ref of its own and never touches a
      store: every call below is addressed with <code>vm._xapiRef</code>.
    </p>
    <p>
      <code>_xapiRef</code> = <strong>{{ vm._xapiRef }}</strong> — <code>power_state</code> =
      <strong>{{ vm.power_state }}</strong>
    </p>
    <div class="actions">
      <UiButton size="medium" variant="secondary" accent="brand" :disabled="isRunning" @click="start">Start</UiButton>
      <UiButton size="medium" variant="secondary" accent="brand" :disabled="!isRunning" @click="reboot">
        Reboot
      </UiButton>
      <UiButton size="medium" variant="secondary" accent="danger" :disabled="!isRunning" @click="shutdown">
        Shutdown
      </UiButton>
    </div>
    <p v-if="lastCall !== undefined">Last call: {{ lastCall }}</p>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { XoVm } from '@vates/types'
import { computed, ref } from 'vue'

const { vm } = defineProps<{ vm: XoVm }>()

const xenApi = useXenApiStore().getXapi()

const isRunning = computed(() => vm.power_state === 'Running')
const lastCall = ref<string>()

// The only adaptation needed: `_xapiRef` is typed `string` on XoVm, while Lite's
// operations take the branded `XenApiVm['$ref']`. One cast at the boundary.
const ref_ = () => vm._xapiRef as XenApiVm['$ref']

const start = async () => {
  lastCall.value = `VM.start(${vm._xapiRef})`
  await xenApi.vm.start(ref_())
}

const reboot = async () => {
  lastCall.value = `VM.clean_reboot(${vm._xapiRef})`
  await xenApi.vm.reboot(ref_())
}

const shutdown = async () => {
  lastCall.value = `VM.clean_shutdown(${vm._xapiRef})`
  await xenApi.vm.shutdown(ref_())
}
</script>

<style scoped lang="postcss">
.actions {
  display: flex;
  gap: 0.8rem;
  margin: 1.6rem 0;
}
</style>
