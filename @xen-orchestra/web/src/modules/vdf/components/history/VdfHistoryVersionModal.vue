<template>
  <VdfContentModal accent="info" @dismiss="emit('cancel')">
    <template #title>{{ title }}</template>
    <template #content>
      <div class="vdf-history-version-modal">
        <VtsStateHero v-if="version === undefined && error === undefined" format="card" type="busy" size="small" />
        <VtsStateHero v-else-if="version === undefined" format="card" type="error" size="small">
          {{ t('firewall:history:version:error', { error }) }}
        </VtsStateHero>
        <template v-else>
          <p class="typo-body-regular-small secondary">{{ byline }}</p>
          <p v-if="entry.outside?.globalChanged" class="typo-body-regular-small secondary">
            {{ t('firewall:outside:global-changed') }}
          </p>
          <p class="typo-body-bold">
            {{ hasPrevious ? t('firewall:history:version:changes') : t('firewall:history:version:content') }}
          </p>
          <p v-if="!hasPrevious" class="typo-body-regular-small secondary">
            {{ noPreviousText }}
          </p>
          <p v-if="isEmptyChange(details)" class="typo-body-regular-small">{{ t('firewall:history:no-change') }}</p>
          <VdfChangeList v-else :details :is-global="isGlobalScope(scopeId)" />
        </template>
      </div>
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('action:close') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton
        v-tooltip="isCurrent ? t('firewall:history:restore:current') : undefined"
        :disabled="version === undefined || isCurrent"
        @click="version !== undefined && emit('restore', version)"
      >
        {{ t('firewall:history:restore') }}
      </VtsOverlayConfirmButton>
    </template>
  </VdfContentModal>
</template>

<script lang="ts" setup>
import VdfChangeList from '@/modules/vdf/components/history/VdfChangeList.vue'
import VdfContentModal from '@/modules/vdf/components/VdfContentModal.vue'
import { useVdfOutsideText } from '@/modules/vdf/composables/vdf-outside.composable.ts'
import { fetchVdfHistoryVersion } from '@/modules/vdf/remote-resources/use-vdf-history.ts'
import type { VdfDocument, VdfHistoryEntry, VdfHistoryVersion, VdfScopeId } from '@/modules/vdf/types.ts'
import { changeDetails, isEmptyChange } from '@/modules/vdf/utils/vdf-change.util.ts'
import { isGlobalScope, withGlobalOf } from '@/modules/vdf/utils/vdf-global.util.ts'
import { emptyDocument } from '@/modules/vdf/utils/vdf-policy.util.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { scopeId, entry } = defineProps<{
  scopeId: VdfScopeId
  entry: VdfHistoryEntry
  // the version the scope enforces now: nothing to restore
  isCurrent: boolean
}>()

const emit = defineEmits<{
  restore: [version: VdfHistoryVersion]
  cancel: []
}>()

const { t, d, n } = useI18n()

const version = ref<VdfHistoryVersion>()

const error = ref<string>()

onMounted(async () => {
  try {
    version.value = await fetchVdfHistoryVersion(scopeId, entry.id)
  } catch (fetchError) {
    error.value = (fetchError as Error).message
  }
})

const title = computed(() => {
  if (entry.publishedAt === null) {
    return t('firewall:history:before-history')
  }

  const date = d(entry.publishedAt, { dateStyle: 'medium', timeStyle: 'short' })

  return entry.outside === undefined
    ? t('firewall:history:version:title', { date })
    : t('firewall:outside:title', { date })
})

const outsideText = useVdfOutsideText()

const byline = computed(() => {
  // vdf#32: who made it is unknown
  if (entry.outside !== undefined) {
    return outsideText.full(entry.outside)
  }

  if (entry.sync !== undefined) {
    return t('firewall:history:sync:info', { n: entry.sync.revision ?? '?' })
  }

  if (entry.revision !== undefined) {
    return t('firewall:history:revision-by', {
      n: entry.revision,
      user: entry.publishedBy ?? t('firewall:history:unknown-user'),
    })
  }

  return entry.publishedBy === null
    ? t('firewall:history:before-history:info')
    : t('firewall:history:by', { user: entry.publishedBy })
})

// a pool's own part: the global part has its own history
const ownPart = (document: VdfDocument) => (isGlobalScope(scopeId) ? document : withGlobalOf(document, emptyDocument()))

const hasPrevious = computed(() => version.value?.previous != null)

// the list's summary was counted at publish time, against the version then
// replaced: say what it was, rather than have "Added" everywhere disagree
// with it
const noPreviousText = computed(() => {
  const { summary } = entry
  const parts = [
    summary.added > 0 ? t('firewall:history:summary:added', { n: n(summary.added) }) : undefined,
    summary.modified > 0 ? t('firewall:history:summary:modified', { n: n(summary.modified) }) : undefined,
    summary.removed > 0 ? t('firewall:history:summary:removed', { n: n(summary.removed) }) : undefined,
  ].filter(part => part !== undefined)

  return entry.previousDocId == null || parts.length === 0
    ? t('firewall:history:version:no-previous')
    : t('firewall:history:version:no-previous:changed', { changes: parts.join(', ') })
})

const details = computed(() => {
  const current = version.value

  if (current === undefined) {
    return changeDetails(emptyDocument(), emptyDocument())
  }

  const before = current.previous === null ? emptyDocument() : ownPart(current.previous.document)
  const withScope = (document: VdfDocument, scope = current.scope) =>
    isGlobalScope(scopeId) && scope !== undefined ? { ...document, scope } : document

  return changeDetails(withScope(before, current.previous?.scope), withScope(ownPart(current.document)))
})
</script>

<style lang="postcss" scoped>
.vdf-history-version-modal {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
