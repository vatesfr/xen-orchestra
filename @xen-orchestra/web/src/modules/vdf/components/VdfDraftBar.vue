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
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useVdfPolicy } from '@/modules/vdf/composables/vdf-policy.composable.ts'
import { useVdfPublish } from '@/modules/vdf/composables/vdf-publish.composable.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const { hasDraft, changes, isDraftOutdated, discardDraft } = useVdfPolicy(() => pool)

const { openPublish } = useVdfPublish(() => pool)

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
