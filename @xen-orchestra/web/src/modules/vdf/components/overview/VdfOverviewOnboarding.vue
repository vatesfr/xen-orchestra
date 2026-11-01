<template>
  <UiCard class="vdf-overview-onboarding">
    <VtsStateHero format="card" type="no-data" size="small" horizontal>
      {{ t('firewall:onboarding:title') }}
    </VtsStateHero>
    <ol class="steps">
      <li class="step">
        <span class="number typo-body-bold" aria-hidden="true">{{ n(1) }}</span>
        <div class="text">
          <span class="typo-body-bold">{{ t('firewall:onboarding:group') }}</span>
          <span class="secondary typo-body-regular-small">{{ t('firewall:onboarding:group:info') }}</span>
        </div>
        <UiButton variant="secondary" accent="brand" size="medium" left-icon="fa:plus" @click="goTo('groups')">
          {{ t('firewall:onboarding:group:action') }}
        </UiButton>
      </li>
      <li class="step">
        <span class="number typo-body-bold" aria-hidden="true">{{ n(2) }}</span>
        <div class="text">
          <span class="typo-body-bold">{{ t('firewall:onboarding:policy') }}</span>
          <span class="secondary typo-body-regular-small">{{ t('firewall:onboarding:policy:info') }}</span>
        </div>
        <UiButton variant="secondary" accent="brand" size="medium" left-icon="fa:plus" @click="goTo('policies')">
          {{ t('firewall:onboarding:policy:action') }}
        </UiButton>
      </li>
      <li class="step">
        <span class="number typo-body-bold" aria-hidden="true">{{ n(3) }}</span>
        <div class="text">
          <span class="typo-body-bold">{{ t('firewall:onboarding:publish') }}</span>
          <span class="secondary typo-body-regular-small">{{ t('firewall:onboarding:publish:info') }}</span>
        </div>
      </li>
    </ol>
  </UiCard>
</template>

<script lang="ts" setup>
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

// a pool with nothing published yet: what to do, in order
const { poolId } = defineProps<{
  poolId: string
}>()

const { t, n } = useI18n()

const router = useRouter()

function goTo(page: 'groups' | 'policies') {
  return router.push(
    page === 'groups'
      ? { name: '/pool/[id]/firewall/groups', params: { id: poolId } }
      : { name: '/pool/[id]/firewall/policies', params: { id: poolId } }
  )
}
</script>

<style lang="postcss" scoped>
.vdf-overview-onboarding {
  .steps {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .step {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1.6rem;
  }

  .number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 3.2rem;
    height: 3.2rem;
    border-radius: 50%;
    color: var(--color-brand-txt-base);
    background-color: var(--color-brand-background-selected);
  }

  .text {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    flex: 1;
    min-width: 24rem;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
