<template>
  <section class="browser-media-console-section" :aria-label="t('local-iso')">
    <UiCardTitle>
      {{ t('local-iso') }}
      <template #info>{{ t('experimental') }}</template>
      <template #description>{{ t('local-iso:description') }}</template>
    </UiCardTitle>
    <template v-if="session !== undefined">
      <div class="state" role="status" aria-live="polite">
        <span class="file-name typo-body-bold">{{ session.fileName }}</span>
        <span class="typo-body-regular-small">{{ statusLabel }}</span>
        <span v-if="session.error !== undefined" class="error typo-body-regular-small">{{ session.error }}</span>
      </div>
      <p v-if="session.status === 'connected'" class="hint typo-body-regular-small">
        {{ t('local-iso:keep-tab-open') }}
      </p>
      <UiButton
        v-if="session.status !== 'connecting'"
        accent="brand"
        variant="secondary"
        size="medium"
        :busy="isDisconnecting"
        @click="disconnectIso()"
      >
        {{ session.status === 'connected' ? t('action:disconnect') : t('action:close') }}
      </UiButton>
    </template>
    <template v-else>
      <UiButton
        v-tooltip="connectErrorMessage"
        accent="brand"
        variant="primary"
        size="medium"
        :disabled="!canConnect"
        @click="open()"
      >
        {{ t('action:connect-local-iso') }}
      </UiButton>
      <p class="hint typo-body-regular-small">{{ t('local-iso:before-start') }}</p>
    </template>
  </section>
</template>

<script lang="ts" setup>
import { useBrowserMediaSessions } from '@/modules/browser-media/composables/use-browser-media-sessions.composable.ts'
import { useXoBrowserMediaConnectJob } from '@/modules/browser-media/jobs/xo-browser-media-connect.job.ts'
import { useXoBrowserMediaDisconnectJob } from '@/modules/browser-media/jobs/xo-browser-media-disconnect.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useFileDialog } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { sessions } = useBrowserMediaSessions()

const session = computed(() => sessions.get(vm.id))

const statusLabel = computed(() => {
  switch (session.value?.status) {
    case 'connecting':
      return t('connecting')
    case 'connected':
      return t('local-iso:streaming')
    case 'disconnected':
      return t('disconnected')
    default:
      return t('connection-failed')
  }
})

const file = ref<File>()

const {
  run: connect,
  canRun: canConnect,
  errorMessage: connectErrorMessage,
} = useXoBrowserMediaConnectJob(() => vm, file)

const { run: disconnect, isRunning: isDisconnecting } = useXoBrowserMediaDisconnectJob(() => vm)

function disconnectIso() {
  // the error is displayed from the session state
  disconnect().catch(error => console.error('Failed to disconnect the local ISO:', error))
}

const { open, onChange } = useFileDialog({ accept: '.iso', multiple: false, reset: true })

onChange(files => {
  file.value = files?.[0]

  if (file.value !== undefined) {
    // the outcome is displayed from the session state
    connect().catch(error => console.error('Failed to connect the local ISO:', error))
  }
})
</script>

<style lang="postcss" scoped>
.browser-media-console-section {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;

  .state {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 1.2rem;
    border-radius: 0.8rem;
    background: var(--color-neutral-background-secondary);
  }

  .file-name,
  .error {
    overflow-wrap: anywhere;
  }

  .error {
    color: var(--color-danger-txt-base);
  }

  .hint {
    margin: 0;
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
