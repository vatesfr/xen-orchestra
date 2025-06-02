<template>
  <div class="pool-connection-success">
    <VtsLoadingHero v-if="!isReady" type="page" />
    <VtsStateHero v-else image="all-good" type="table" no-background>
      <div class="content">
        <h1>{{ t('connected-to-ip', { ip }) }}</h1>
        <UiAlert accent="success">
          {{ t('pool-connection-success') }}
        </UiAlert>
        <div>
          <UiLink v-if="poolId" :to="{ name: '/pool/[id]', params: { id: poolId } }" size="medium">
            {{ t('Visit-pool-dashboard') }}
          </UiLink>
          <UiButton variant="secondary" accent="brand" size="medium" :left-icon="faPlus" @click="connectAnotherPool()">
            {{ t('Connect-another-pool') }}
          </UiButton>
        </div>
      </div>
    </VtsStateHero>
  </div>
</template>

<script setup lang="ts">
import { useServerStore } from '@/stores/xo-rest-api/server.store'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()
const { get, isReady } = useServerStore().subscribe()

const { ip, idServer } = history.state
const poolId = computed(() => get(idServer)?.poolId)

function connectAnotherPool() {
  router.push({
    path: '/pool/connect/',
  })
}
</script>

<style lang="postcss" scoped>
.pool-connection-success {
  .content {
    color: var(--color-neutral-txt-primary);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rem;
    width: min-content;

    h1 {
      text-wrap: nowrap;
    }

    div {
      display: flex;
      gap: 2.4rem;
    }
  }
}
</style>
