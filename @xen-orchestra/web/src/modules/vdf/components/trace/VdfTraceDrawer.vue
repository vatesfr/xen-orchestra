<template>
  <UiDrawer size="wide" @dismiss="emit('cancel')">
    <template #title>{{ t('firewall:trace:title') }}</template>
    <template #content>
      <VtsStateHero v-if="pool === undefined" format="card" type="busy" size="small" />
      <VdfTracePanel v-else :pool :initial="query" />
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('action:close') }}</VtsOverlayCancelButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { VdfTraceQuery } from '@/modules/vdf/components/trace/VdfTraceForm.vue'
import VdfTracePanel from '@/modules/vdf/components/trace/VdfTracePanel.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import { useI18n } from 'vue-i18n'

// A trace from where the question came up (a row's "Why?", a VM's page),
// without leaving it. It never writes the URL: XO closes overlays on any
// navigation
const { poolId, query = {} } = defineProps<{
  poolId: string
  query?: VdfTraceQuery
}>()

const emit = defineEmits<{
  cancel: []
}>()

const { t } = useI18n()

const { useGetPoolById } = useXoPoolCollection()

const pool = useGetPoolById(() => poolId as FrontXoPool['id'])
</script>
