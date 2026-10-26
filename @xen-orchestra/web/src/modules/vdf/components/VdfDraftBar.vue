<template>
  <div v-if="notices.length > 0" class="vdf-draft-bar notices">
    <UiAlert v-for="notice of notices" :key="notice" accent="info">{{ notice }}</UiAlert>
  </div>
  <div v-if="hasDraft" class="vdf-draft-bar">
    <VtsBanner :accent="isDraftOutdated ? 'warning' : 'brand'">
      <div class="text" role="status">
        <VtsIcon
          :name="isDraftOutdated ? 'status:warning-circle' : 'action:edit'"
          size="medium"
          class="icon"
          :class="{ warning: isDraftOutdated }"
        />
        <span class="typo-body-bold">{{ t('firewall:draft:changes', { n: changes.length }, changes.length) }}</span>
        <span class="typo-body-regular-small secondary">
          {{ isDraftOutdated ? t('firewall:draft:outdated') : t('firewall:draft:info') }}
        </span>
      </div>
      <template #addons>
        <div class="actions">
          <UiButton variant="tertiary" accent="danger" size="small" left-icon="action:undo" @click="openDiscard()">
            {{ t('firewall:draft:discard') }}
          </UiButton>
          <UiButton
            v-if="isDraftOutdated"
            variant="primary"
            accent="warning"
            size="small"
            left-icon="fa:repeat"
            @click="openRebase()"
          >
            {{ t('firewall:draft:rebase') }}
          </UiButton>
          <UiButton
            v-else
            v-tooltip="!canEdit && readOnlyText"
            variant="primary"
            accent="brand"
            size="small"
            left-icon="fa:upload"
            :busy="isPublishing"
            :disabled="!canEdit"
            @click="openPublish()"
          >
            {{ t('firewall:draft:review-and-publish') }}
          </UiButton>
        </div>
      </template>
    </VtsBanner>
  </div>
  <div v-else-if="publishProgress !== undefined" class="vdf-draft-bar published" role="status">
    <UiAlert
      :accent="publishProgress.done ? 'success' : publishProgress.failed.length > 0 ? 'warning' : 'info'"
      close
      @close="dismiss(publishProgress.id)"
    >
      {{
        t(
          isGlobal
            ? 'firewall:global:published:in-sync'
            : publishProgress.monitorOnly
              ? 'firewall:published:monitoring'
              : 'firewall:published:enforcing',
          { n: publishProgress.enforcing, total: publishProgress.total }
        )
      }}
      <template #description>
        <template v-if="publishProgress.done">
          {{ publishProgress.monitorOnly ? t('firewall:published:done:monitor') : t('firewall:published:done') }}
        </template>
        <template v-else-if="publishProgress.failed.length > 0">
          {{ t('firewall:global:published:not-written', { pools: publishProgress.failed.join(', ') }) }}
        </template>
        <template v-else>{{ t('firewall:published:waiting') }}</template>
      </template>
    </UiAlert>
  </div>
</template>

<script lang="ts" setup>
import { useVdfGlobalPolicy } from '@/modules/vdf/composables/vdf-global.composable.ts'
import { useVdfPolicy } from '@/modules/vdf/composables/vdf-policy.composable.ts'
import { useVdfPublish } from '@/modules/vdf/composables/vdf-publish.composable.ts'
import type { VdfScope } from '@/modules/vdf/composables/vdf-scope.composable.ts'
import VtsBanner from '@core/components/banner/VtsBanner.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { scope } = defineProps<{
  scope: VdfScope
}>()

const { t } = useI18n()

const isGlobal = scope.kind === 'global'

// after a publish, the bar follows the hosts (the pools, for the global
// configuration) until all of them enforce it, then closes by itself
// (it's on every tab of the firewall)
const dismissedDocId = ref<string>()

function dismiss(id: string) {
  dismissedDocId.value = id
}

const { hasDraft, changes, isDraftOutdated, publishProgress, canEdit, otherXo } = (() => {
  if (scope.kind === 'global') {
    const global = useVdfGlobalPolicy()

    return {
      ...global,
      otherXo: computed(() => undefined),
      publishProgress: computed(() => {
        const publish = global.lastPublish.value
        const id = `r${publish?.revision}`

        if (publish === undefined || publish.revision !== global.revision.value || id === dismissedDocId.value) {
          return undefined
        }

        const total = global.inScopePoolCount.value
        const enforcing = global.inSyncPoolCount.value

        // pools this revision couldn't be written into yet (XO retries)
        const failed = global.pools.value
          .filter(pool => pool.inScope && pool.state !== 'in-sync' && pool.sync?.ok === false)
          .map(pool => (pool.sync?.error ? `${pool.name} (${pool.sync.error})` : pool.name))

        return { id, enforcing, total, done: enforcing === total, failed, monitorOnly: publish.monitorOnly === true }
      }),
    }
  }

  const policy = useVdfPolicy(() => scope.pool)

  return {
    ...policy,
    otherXo: computed(() => policy.globalInfo.value?.owner),
    publishProgress: computed(() => {
      const publish = policy.lastPublish.value

      if (
        publish === undefined ||
        publish.docId !== policy.publishedDocId.value ||
        publish.docId === dismissedDocId.value
      ) {
        return undefined
      }

      const enforcing = policy.hosts.value.filter(({ status }) => status?.doc === publish.docId).length
      const total = policy.liveHostCount.value

      // a pool publish is written by the call itself, or refused
      return {
        id: publish.docId,
        enforcing,
        total,
        done: enforcing === total,
        failed: [] as string[],
        monitorOnly: publish.monitorOnly === true,
      }
    }),
  }
})()

const DONE_SHOWN_MS = 10_000

let closeTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => (publishProgress.value?.done ? publishProgress.value.id : undefined),
  id => {
    clearTimeout(closeTimer)

    if (id !== undefined) {
      closeTimer = setTimeout(() => dismiss(id), DONE_SHOWN_MS)
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => clearTimeout(closeTimer))

const { openPublish, openRebase, openDiscard, isPublishing } = useVdfPublish(() => scope)

const readOnlyText = computed(() => t(isGlobal ? 'firewall:global:read-only' : 'firewall:read-only'))

// on every page of the firewall: what the user can't change here
const notices = computed(() => [
  ...(canEdit.value ? [] : [readOnlyText.value]),
  ...(otherXo.value === undefined ? [] : [t('firewall:global:other-xo', { xo: otherXo.value })]),
])
</script>

<style lang="postcss" scoped>
/* stays in view while the page scrolls, with "Review and publish" */
.vdf-draft-bar {
  position: sticky;
  inset-block-start: 0;
  z-index: 1;

  &.published,
  &.notices {
    position: static;
    margin: 0.8rem 0.8rem 0;
  }

  &.notices {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .text {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 0.8rem;
  }

  .icon {
    color: var(--color-brand-item-base);

    &.warning {
      color: var(--color-warning-item-base);
    }
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }

  /* the text wraps, not the buttons */
  .actions {
    display: flex;
    gap: 0.8rem;
    white-space: nowrap;
  }
}
</style>
