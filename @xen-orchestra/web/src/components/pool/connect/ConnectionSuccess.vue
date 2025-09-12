<template>
  <VtsStateHero class="connection-success" type="all-good" format="card" size="medium">
    <div class="container">
      <div v-if="server" class="typo-h1 title">{{ t('connected-to-ip', { ip: server.host }) }}</div>
      <div class="content" :class="{ mobile: uiStore.isMobile, desktop: !uiStore.isDesktopLarge }">
        <UiAlert accent="success">
          {{ t('pool-connection-success') }}
        </UiAlert>
        <div class="action-buttons" :class="{ mobile: uiStore.isMobile }">
          <UiLink
            v-if="server && server.poolId"
            :to="{ name: '/pool/[id]/dashboard', params: { id: server.poolId } }"
            size="medium"
          >
            {{ t('visit-pool-dashboard') }}
          </UiLink>
          <UiButton
            variant="secondary"
            accent="brand"
            size="medium"
            left-icon="fa:plus"
            @click="emit('connectAnotherPool')"
          >
            {{ t('connect-another-pool') }}
          </UiButton>
        </div>
      </div>
    </div>
  </VtsStateHero>
</template>

<script setup lang="ts">
import { useXoServerCollection } from '@/remote-resources/use-xo-server-collection.ts'
import type { XoServer } from '@/types/xo/server.type.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'

const { serverId } = defineProps<{
  serverId: XoServer['id']
}>()

const emit = defineEmits<{
  connectAnotherPool: []
}>()

const { t } = useI18n()
const { useGetServerById } = useXoServerCollection()
const uiStore = useUiStore()

const server = useGetServerById(() => serverId)
</script>

<style lang="postcss" scoped>
.connection-success {
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rem;
  }

  .title {
    text-align: center;
    color: var(--color-neutral-txt-primary);
  }

  .content {
    color: var(--color-neutral-txt-primary);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rem;
    margin: 0 auto;
    width: 65%;

    &.desktop {
      width: 80%;
    }

    &.mobile {
      width: 100%;
    }

    .action-buttons {
      display: flex;
      gap: 2.4rem;

      &.mobile {
        flex-direction: column;
        align-items: center;
      }
    }
  }
}
</style>
