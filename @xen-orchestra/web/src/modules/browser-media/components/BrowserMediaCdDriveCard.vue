<template>
  <div class="browser-media-cd-drive-card">
    <UiCardTitle>
      {{ t('cd-drive') }}
      <template #info>{{ t('experimental') }}</template>
      <template #description>{{ t('browser-media:insert-hint') }}</template>
    </UiCardTitle>

    <UiAlert
      v-if="localSession?.error !== undefined"
      :accent="localSession.error.reason === 'ejected' ? 'info' : 'danger'"
      close
      @close="sessionsStore.dismiss(vm.id)"
    >
      {{ errorMessage }}
      <template v-if="localSession.error.message !== undefined" #description>
        {{ localSession.error.message }}
      </template>
    </UiAlert>

    <UiAlert v-if="pickError !== undefined" accent="danger" close @close="pickError = undefined">
      {{ pickError }}
    </UiAlert>

    <!-- an ISO streamed from a browser: this tab, or another one -->
    <template v-if="servedIso !== undefined">
      <div class="iso" role="status" aria-live="polite">
        <span class="name typo-body-bold">{{ servedIso.name }}</span>
        <span class="secondary typo-body-regular-small">
          <UiLoader v-if="isInserting || servedIso.status === 'ejecting'" />
          {{ servedIsoStatus }}
        </span>
        <span v-if="servedIsoStats !== undefined" class="secondary typo-body-regular-small">{{ servedIsoStats }}</span>
      </div>
      <UiInfo v-if="servedIso.isLocal" accent="warning" size="small" wrap>
        {{ t('browser-media:keep-tab-open') }}
      </UiInfo>
      <div>
        <UiButton
          v-if="isInserting"
          accent="brand"
          variant="secondary"
          size="medium"
          @click="sessionsStore.cancel(vm.id)"
        >
          {{ t('cancel') }}
        </UiButton>
        <UiButton
          v-else
          v-tooltip="!canEject && !isEjecting ? ejectErrorMessage : undefined"
          accent="brand"
          variant="primary"
          size="medium"
          :busy="isEjecting"
          :disabled="!canEject"
          @click="ejectIso()"
        >
          {{ t('action:eject') }}
        </UiButton>
      </div>
    </template>

    <!-- an ISO inserted by other means, e.g. from an ISO SR -->
    <template v-else-if="insertedVdiId !== undefined">
      <span class="name typo-body-bold">{{ insertedVdiName }}</span>
      <UiInfo accent="info" size="small" wrap>{{ t('browser-media:eject-first') }}</UiInfo>
    </template>

    <VtsStateHero v-else-if="!areVmVbdsReady" format="card" type="busy" size="extra-small" horizontal />

    <template v-else>
      <span class="secondary typo-body-regular-small">{{ hasCdDrive ? t('empty') : t('no-cd-drive') }}</span>
      <div>
        <UiButton
          v-tooltip="!canInsert ? insertErrorMessage : undefined"
          accent="brand"
          variant="primary"
          size="medium"
          :disabled="!canInsert"
          @click="pickIso()"
        >
          {{ t('action:insert-iso-from-this-computer') }}
        </UiButton>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { useBrowserMediaCdDrive } from '@/modules/browser-media/composables/use-browser-media-cd-drive.composable.ts'
import { useXoBrowserMediaEjectJob } from '@/modules/browser-media/jobs/xo-browser-media-eject.job.ts'
import { useXoBrowserMediaInsertJob } from '@/modules/browser-media/jobs/xo-browser-media-insert.job.ts'
import { useBrowserMediaSessionsStore } from '@/modules/browser-media/stores/browser-media-sessions.store.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useFileDialog } from '@vueuse/core'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const sessionsStore = useBrowserMediaSessionsStore()

const {
  localSession,
  servedIso,
  servedIsoStatus,
  servedIsoStats,
  isInserting,
  errorMessage,
  insertedVdiId,
  insertedVdiName,
  areVmVbdsReady,
  hasCdDrive,
} = useBrowserMediaCdDrive(() => vm)

const file = ref<File>()

const { run: insert, canRun: canInsert, errorMessage: insertErrorMessage } = useXoBrowserMediaInsertJob(() => vm, file)

const {
  run: eject,
  canRun: canEject,
  isRunning: isEjecting,
  errorMessage: ejectErrorMessage,
} = useXoBrowserMediaEjectJob(() => vm)

function ejectIso() {
  // the error is displayed from the session state
  eject().catch(error => console.error('Failed to eject the ISO:', error))
}

// a file refused before any session exists, e.g. of an invalid size
const pickError = ref<string>()

const { open, onChange } = useFileDialog({ accept: '.iso', multiple: false, reset: true })

function pickIso() {
  pickError.value = undefined
  open()
}

onChange(files => {
  file.value = files?.[0]

  if (file.value === undefined) {
    return
  }

  const insertion = insert()
  // the next pick is validated on its own
  file.value = undefined

  insertion.catch(error => {
    if (localSession.value === undefined) {
      pickError.value = (error as Error).message
    }
    // otherwise, displayed from the session state
    console.error('Failed to insert the ISO:', error)
  })
})
</script>

<style lang="postcss" scoped>
.browser-media-cd-drive-card {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  width: 100%;

  .iso {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .name {
    overflow-wrap: anywhere;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
