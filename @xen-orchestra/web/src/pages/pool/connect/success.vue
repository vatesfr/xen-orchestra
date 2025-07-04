<template>
  <ConnectPoolHeader />
  <UiCard class="pool-connection-success">
    <VtsLoadingHero v-if="!isReady" type="page" />
    <VtsStateHero v-else image="all-good" type="table" no-background>
      <p class="typo-h1 title">{{ t('unable-to-connect-to', { ip }) }}</p>
    </VtsStateHero>
    <div class="content">
      <UiAlert accent="success">
        {{ t('pool-connection-success') }}
      </UiAlert>
      <div :class="{ mobile: uiStore.isMobile }">
        <!-- TODO change link to /dashboard -->
        <UiLink v-if="poolId" :to="{ name: '/pool/[id]/system', params: { id: poolId } }" size="medium">
          {{ t('visit-pool-dashboard') }}
        </UiLink>
        <RouterLink to="/pool/connect/">
          <UiButton variant="secondary" accent="brand" size="medium" :left-icon="faPlus">
            {{ t('connect-another-pool') }}
          </UiButton>
        </RouterLink>
      </div>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import ConnectPoolHeader from '@/components/pool/connect/ConnectPoolHeader.vue'
import { useServerStore } from '@/stores/xo-rest-api/server.store'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useUiStore } from '@core/stores/ui.store'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { get, isReady } = useServerStore().subscribe()
const uiStore = useUiStore()

const { ip, idServer } = history.state
const poolId = computed(() => get(idServer)?.poolId)
</script>

<style lang="postcss" scoped>
.pool-connection-success {
  margin: 0.8rem;

  .title {
    text-align: center;
  }

  .content {
    color: var(--color-neutral-txt-primary);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rem;
    margin: 0 auto;

    h1 {
      text-wrap: nowrap;
    }

    div {
      display: flex;
      gap: 2.4rem;
    }

    div.mobile {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2.4rem;
    }
  }
}
</style>
