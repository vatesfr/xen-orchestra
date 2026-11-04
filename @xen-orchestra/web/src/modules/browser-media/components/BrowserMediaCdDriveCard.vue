<template>
  <section class="browser-media-cd-drive-card" :aria-label="t('cd-drive')">
    <UiCardTitle>
      {{ t('cd-drive') }}
      <template #info>{{ t('experimental') }}</template>
    </UiCardTitle>

    <UiAlert
      v-if="localSession?.error !== undefined"
      :accent="localSession.error.reason === 'ejected' ? 'info' : 'danger'"
      close
      @close="dismiss(vm.id)"
    >
      {{ t(`browser-media:ended:${localSession.error.reason}`, { name: localSession.name }) }}
      <template v-if="localSession.error.message !== undefined" #description>
        {{ localSession.error.message }}
      </template>
    </UiAlert>

    <UiAlert v-if="pickError !== undefined" accent="danger" close @close="pickError = undefined">
      {{ pickError }}
    </UiAlert>

    <!-- an ISO streamed from a browser: this tab, or another one -->
    <template v-if="servedIso !== undefined">
      <div class="state" role="status" aria-live="polite">
        <span class="name typo-body-bold">{{ servedIso.name }}</span>
        <span class="typo-body-regular-small">{{ servedIsoStatus }}</span>
        <span v-if="servedIsoStats !== undefined" class="stats typo-body-regular-small">{{ servedIsoStats }}</span>
      </div>
      <p v-if="servedIso.isLocal" class="hint typo-body-regular-small">{{ t('browser-media:keep-tab-open') }}</p>
      <div class="buttons">
        <UiButton
          v-if="localSession?.status === 'connecting' || localSession?.status === 'inserting'"
          accent="brand"
          variant="secondary"
          size="medium"
          @click="cancel(vm.id)"
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
    <div v-else-if="insertedVdiId !== undefined" class="state">
      <span class="name typo-body-bold">{{ insertedVdiName }}</span>
      <span class="hint typo-body-regular-small">{{ t('browser-media:eject-first') }}</span>
    </div>

    <div v-else-if="!areCdDrivesKnown" class="state">
      <span class="typo-body-regular-small">{{ t('loading') }}</span>
    </div>

    <template v-else>
      <div class="state">
        <span class="typo-body-regular-small">{{ cdDrives.length === 0 ? t('no-cd-drive') : t('empty') }}</span>
      </div>
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
      <p class="hint typo-body-regular-small">{{ t('browser-media:insert-hint') }}</p>
    </template>
  </section>
</template>

<script lang="ts" setup>
import { useBrowserMediaSessions } from '@/modules/browser-media/composables/use-browser-media-sessions.composable.ts'
import { useXoBrowserMediaEjectJob } from '@/modules/browser-media/jobs/xo-browser-media-eject.job.ts'
import { useXoBrowserMediaInsertJob } from '@/modules/browser-media/jobs/xo-browser-media-insert.job.ts'
import { useXoBrowserMediaCollection } from '@/modules/browser-media/remote-resources/use-xo-browser-media-collection.ts'
import { useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { formatSize } from '@core/utils/size.util.ts'
import type { XoVdi } from '@vates/types'
import { useFileDialog } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t, d } = useI18n()

const { getLocalSession, hasEnded, cancel, dismiss } = useBrowserMediaSessions()
const { getBrowserMediaByVmId, reloadBrowserMediaSessions } = useXoBrowserMediaCollection()
const { getVbdsByIds, areVbdsReady } = useXoVbdCollection()
const { getVdiById } = useXoVdiCollection()
const { getUserById } = useXoUserCollection()

const localSession = computed(() => getLocalSession(vm.id))

// as seen by xo-server, whichever browser serves it, unless this tab ended it since the last poll
const serverSession = computed(() => {
  const session = getBrowserMediaByVmId(vm.id)

  return session === undefined || hasEnded(session.id) ? undefined : session
})

// the stats, and the state seen by the other tabs, without waiting for the next poll
watch(
  () => localSession.value?.status,
  () => reloadBrowserMediaSessions().catch(error => console.error('Failed to reload the browser media:', error))
)

const vbds = computed(() => getVbdsByIds(vm.$VBDs))

// the collection may be ready a moment before it has the drives of this VM
const areCdDrivesKnown = computed(() => areVbdsReady.value && vbds.value.length === vm.$VBDs.length)

const cdDrives = computed(() => vbds.value.filter(vbd => vbd.is_cd_drive))

const insertedVdiId = computed(() => cdDrives.value.find(vbd => vbd.VDI !== undefined)?.VDI)

const insertedVdiName = computed(() => {
  const vdiId = insertedVdiId.value

  return vdiId === undefined ? undefined : (getVdiById(vdiId as XoVdi['id'])?.name_label ?? vdiId)
})

const servedIso = computed(() => {
  const local = localSession.value

  if (local !== undefined && local.status !== 'ended') {
    return { isLocal: true, name: local.name }
  }

  const server = serverSession.value

  return server === undefined ? undefined : { isLocal: false, name: server.name }
})

const servedIsoStatus = computed(() => {
  const local = localSession.value

  if (local !== undefined && local.status !== 'ended') {
    return t(`browser-media:status:${local.status}`)
  }

  const server = serverSession.value

  if (server === undefined) {
    return undefined
  }

  const userName = getUserById(server.userId)?.name ?? server.userId

  return server.status === 'inserted'
    ? t('browser-media:served-by-another-browser', { user: userName })
    : t(`browser-media:status:${server.status}`)
})

const servedIsoStats = computed(() => {
  const server = serverSession.value

  // xo-server may not have been polled since this tab inserted it
  if (server === undefined || server.status !== 'inserted') {
    return undefined
  }

  return t('browser-media:stats', {
    since: d(new Date(server.insertedAt), 'datetime_short'),
    size: formatSize(server.bytesRead, 1),
  })
})

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
  gap: 1.2rem;
  width: 100%;

  .state {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 1.2rem;
    border-radius: 0.8rem;
    background: var(--color-neutral-background-secondary);
  }

  .name {
    overflow-wrap: anywhere;
  }

  .stats,
  .hint {
    margin: 0;
    color: var(--color-neutral-txt-secondary);
  }

  .buttons {
    display: flex;
    gap: 0.8rem;
  }
}
</style>
