<template>
  <VtsSuccessStateHero>
    <template v-if="server" #title>{{ t('connected-to-ip', { ip: server.host }) }}</template>
    {{ t('pool-connection-success') }}
    <template #actions>
      <UiLink
        v-if="server && server.poolId"
        :to="{ name: '/pool/[id]/dashboard', params: { id: server.poolId } }"
        size="medium"
      >
        {{ t('action:visit-pool-dashboard') }}
      </UiLink>
      <UiButton
        variant="secondary"
        accent="brand"
        size="medium"
        left-icon="fa:plus"
        @click="emit('connectAnotherPool')"
      >
        {{ t('action:connect-another-pool') }}
      </UiButton>
    </template>
  </VtsSuccessStateHero>
</template>

<script setup lang="ts">
import {
  type FrontXoServer,
  useXoServerCollection,
} from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import VtsSuccessStateHero from '@core/components/success-state-hero/VtsSuccessStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useI18n } from 'vue-i18n'

const { serverId } = defineProps<{
  serverId: FrontXoServer['id']
}>()

const emit = defineEmits<{
  connectAnotherPool: []
}>()

const { t } = useI18n()
const { useGetServerById } = useXoServerCollection()

const server = useGetServerById(() => serverId)
</script>
