<template>
  <div v-if="hasDraft" class="vdf-draft-bar" :class="{ outdated: isDraftOutdated }">
    <VtsIcon :name="isDraftOutdated ? 'status:warning-circle' : 'fa:pencil'" size="medium" class="icon" />
    <div class="text">
      <span class="typo-body-bold">{{ t('firewall:draft:changes', { n: changes.length }) }}</span>
      <span class="typo-body-regular-small secondary">
        {{ isDraftOutdated ? t('firewall:draft:outdated') : t('firewall:draft:info') }}
      </span>
    </div>
    <div class="actions">
      <UiButton variant="tertiary" accent="danger" size="medium" left-icon="fa:rotate-left" @click="discard()">
        {{ t('firewall:draft:discard') }}
      </UiButton>
      <UiButton variant="primary" accent="brand" size="medium" left-icon="fa:upload" @click="review()">
        {{ t('firewall:draft:review-and-publish') }}
      </UiButton>
    </div>
  </div>
  <div v-else-if="publishProgress !== undefined" class="vdf-draft-bar published">
    <VtsIcon :name="publishProgress.done ? 'fa:check' : 'fa:spinner'" size="medium" class="icon" />
    <div class="text">
      <span class="typo-body-bold">
        {{
          t(isGlobal ? 'firewall:global:published:in-sync' : 'firewall:published:enforcing', {
            n: publishProgress.enforcing,
            total: publishProgress.total,
          })
        }}
      </span>
      <span class="typo-body-regular-small secondary">
        {{ publishProgress.done ? t('firewall:published:done') : t('firewall:published:waiting') }}
      </span>
    </div>
    <div class="actions">
      <UiButton variant="tertiary" accent="brand" size="medium" @click="dismissedDocId = publishProgress.id">
        {{ t('firewall:published:dismiss') }}
      </UiButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useVdfGlobalPolicy } from '@/modules/vdf/composables/vdf-global.composable.ts'
import { useVdfPolicy } from '@/modules/vdf/composables/vdf-policy.composable.ts'
import { useVdfPublish } from '@/modules/vdf/composables/vdf-publish.composable.ts'
import type { VdfScope } from '@/modules/vdf/composables/vdf-scope.composable.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { scope } = defineProps<{
  scope: VdfScope
}>()

const { t } = useI18n()

const isGlobal = scope.kind === 'global'

// after a publish, the bar follows the hosts (the pools, for the global
// configuration) until all of them enforce it
const dismissedDocId = ref<string>()

const { hasDraft, changes, isDraftOutdated, discardDraft, publishProgress } = (() => {
  if (scope.kind === 'global') {
    const global = useVdfGlobalPolicy()

    return {
      ...global,
      publishProgress: computed(() => {
        const publish = global.lastPublish.value
        const id = `r${publish?.revision}`

        if (publish === undefined || publish.revision !== global.revision.value || id === dismissedDocId.value) {
          return undefined
        }

        const total = global.inScopePoolCount.value
        const enforcing = global.inSyncPoolCount.value

        return { id, enforcing, total, done: enforcing === total }
      }),
    }
  }

  const policy = useVdfPolicy(() => scope.pool)

  return {
    ...policy,
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

      return { id: publish.docId, enforcing, total, done: enforcing === total }
    }),
  }
})()

const { openPublish } = useVdfPublish(() => scope)

function discard() {
  discardDraft()
}

function review() {
  void openPublish()
}
</script>

<style lang="postcss" scoped>
.vdf-draft-bar {
  display: flex;
  align-items: center;
  gap: 1.6rem;
  margin: 0.8rem 0.8rem 0;
  padding: 1.2rem 1.6rem;
  border: 0.1rem solid var(--color-brand-item-base);
  border-radius: 0.8rem;
  background-color: var(--color-brand-background-selected);

  .icon {
    color: var(--color-brand-item-base);
  }

  &.published {
    border-color: var(--color-success-item-base);
    background-color: var(--color-success-background-selected);

    .icon {
      color: var(--color-success-item-base);
    }
  }

  &.outdated {
    border-color: var(--color-warning-item-base);
    background-color: var(--color-warning-background-selected);

    .icon {
      color: var(--color-warning-item-base);
    }
  }

  .text {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    flex: 1;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }

  .actions {
    display: flex;
    gap: 0.8rem;
  }
}
</style>
