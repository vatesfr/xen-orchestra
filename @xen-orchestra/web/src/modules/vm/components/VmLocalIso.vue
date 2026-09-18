<template>
  <section v-if="enabled" class="local-iso" :aria-label="t('browser-media:title')">
    <UiCardTitle>
      {{ t('browser-media:title') }}
      <template #info>{{ t('browser-media:experimental') }}</template>
      <template #description>{{ t('browser-media:description') }}</template>
    </UiCardTitle>
    <template v-if="session">
      <div class="media-state" role="status" aria-live="polite">
        <span class="filename typo-body-bold">{{ session.name }}</span>
        <span class="typo-body-regular-small">{{ t(`browser-media:${session.status}`) }}</span>
        <span v-if="session.error" class="error typo-body-regular-small">{{ session.error }}</span>
      </div>
      <p v-if="session.status === 'connected'" class="hint typo-body-regular-small">
        {{ t('browser-media:keep-open') }}
      </p>
      <UiButton
        v-if="session.status !== 'connecting'"
        accent="brand"
        variant="secondary"
        size="medium"
        :busy="session.disconnecting"
        @click="disconnectBrowserMedia(vm.id)"
      >
        {{ t(session.status === 'connected' ? 'browser-media:disconnect' : 'browser-media:dismiss') }}
      </UiButton>
    </template>
    <template v-else>
      <input ref="file-input" hidden type="file" accept=".iso" @change="selectFile" />
      <UiButton accent="brand" variant="primary" size="medium" :disabled="!canConnect" @click="fileInput?.click()">
        {{ t('browser-media:connect') }}
      </UiButton>
      <p class="hint typo-body-regular-small">{{ t('browser-media:before-start') }}</p>
    </template>
  </section>
</template>

<script setup lang="ts">
import {
  browserMediaSessions,
  connectBrowserMedia,
  disconnectBrowserMedia,
} from '@/modules/vm/composables/browser-media.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { fetchRequest } from '@/shared/utils/fetch.util.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{ vm: FrontXoVm }>()
const { t } = useI18n()
const enabled = ref(false)
const fileInput = useTemplateRef('file-input')
const session = computed(() => browserMediaSessions.get(vm.id))
const canConnect = computed(() => ['Running', 'Halted'].includes(vm.power_state))
onMounted(async () => {
  // The endpoint is admin-only; absent/disabled experiments stay hidden.
  try {
    enabled.value = await fetchRequest<boolean>('browser-media')
  } catch {
    /* unavailable */
  }
})
function selectFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file !== undefined) void connectBrowserMedia(vm.id, file)
}
</script>

<style scoped lang="postcss">
.local-iso {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  padding-bottom: 1.6rem;
  border-bottom: 0.1rem solid var(--color-neutral-border);
}
.media-state {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 1.2rem;
  border-radius: 0.8rem;
  background: var(--color-neutral-background-secondary);
}
.filename {
  overflow-wrap: anywhere;
}
.hint {
  color: var(--color-neutral-txt-secondary);
  margin: 0;
}
.error {
  color: var(--color-danger-txt-base);
  overflow-wrap: anywhere;
}
</style>
