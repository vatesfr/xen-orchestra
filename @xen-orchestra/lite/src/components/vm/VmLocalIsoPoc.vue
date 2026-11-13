<!-- Internal PoC: localization will follow once the UX and host protocol are settled. -->
<!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
<template>
  <section class="local-iso-poc">
    <strong>Local ISO · internal PoC</strong>
    <template v-if="current">
      <span>{{ current.name }} — {{ current.status }}</span>
      <span>{{ (current.bytes / 1024 / 1024).toFixed(1) }} MiB streamed</span>
      <button type="button" @click="disconnect">Disconnect ISO</button>
    </template>
    <p v-else-if="other">{{ other.name }} — {{ other.attached ? 'connected' : 'connecting' }} from another tab</p>
    <label v-else>Connect a local ISO <input type="file" accept=".iso" @change="select" /></label>
    <small>Keep the source tab open. Closing or reloading it disconnects the ISO. Single host only.</small>
    <span v-if="error">{{ error }}</span>
  </section>
</template>

<script setup lang="ts">
import { connectMedia, disconnectMedia, listMedia, mediaSessions } from '@/libs/local-iso-poc.ts'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import { computed, onMounted, onUnmounted, ref } from 'vue'
const props = defineProps<{ vm: XenApiVm }>()
const store = useXenApiStore()
const current = computed(() => mediaSessions.get(props.vm.$ref))
const other = ref<{ name: string; attached: boolean }>()
const error = ref('')
async function refresh() {
  if (!store.currentSessionId) return
  try {
    other.value = (await listMedia(store.currentSessionId)).find(m => m.vm === props.vm.$ref && !m.closed)
    error.value = ''
  } catch {
    error.value = 'The host media PoC helper is unavailable or this account is not a local administrator.'
  }
}
async function select(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file && store.currentSessionId) await connectMedia(props.vm.$ref, file, store.currentSessionId)
  await refresh()
}
async function disconnect() {
  if (store.currentSessionId) await disconnectMedia(props.vm.$ref, store.currentSessionId)
  await refresh()
}
let timer: ReturnType<typeof setInterval>
onMounted(() => {
  void refresh()
  timer = setInterval(refresh, 5000)
})
onUnmounted(() => clearInterval(timer))
</script>

<style scoped lang="postcss">
.local-iso-poc {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #6095b5;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}
.local-iso-poc small {
  flex-basis: 100%;
}
.local-iso-poc button {
  padding: 0.5rem;
  cursor: pointer;
}
</style>

<!-- eslint-enable @intlify/vue-i18n/no-raw-text -->
