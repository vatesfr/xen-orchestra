<template>
  <UiDrawer size="wide" @dismiss="emit('cancel')">
    <template #title>{{ t('firewall:monitor:drawer:title', { policy: displayName(policy) }) }}</template>
    <template #content>
      <VtsStateHero v-if="pool === undefined" format="card" type="busy" size="small" />
      <VdfMonitorReport v-else :pool :policy />
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('action:close') }}</VtsOverlayCancelButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfMonitorReport from '@/modules/vdf/components/monitor/VdfMonitorReport.vue'
import { displayName } from '@/modules/vdf/utils/vdf-global.util.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import { useI18n } from 'vue-i18n'

// A monitored policy's report from its row on the Policies board: what it
// would drop, with "Allow this" (the rule drawer, which closes this one)
const { poolId, policy } = defineProps<{
  poolId: string
  policy: string
}>()

const emit = defineEmits<{
  cancel: []
}>()

const { t } = useI18n()

const { useGetPoolById } = useXoPoolCollection()

const pool = useGetPoolById(() => poolId as FrontXoPool['id'])
</script>
