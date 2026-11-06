<template>
  <UiDrawer size="wide" @dismiss="emit('cancel')">
    <template #title>{{ t('firewall:trace:title') }}</template>
    <template #content>
      <VtsStateHero v-if="pool === undefined" format="card" type="busy" size="small" />
      <VdfTraceDrawerContent v-else :pool :query />
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('action:close') }}</VtsOverlayCancelButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfTraceDrawerContent from '@/modules/vdf/components/trace/VdfTraceDrawerContent.vue'
import type { VdfTraceQuery } from '@/modules/vdf/components/trace/VdfTraceForm.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import { useI18n } from 'vue-i18n'

// A trace from where the question came up (a row's "Why?", a VM's page,
// the Firewall's "Trace a connection"), without leaving it: Trace is no
// page of its own. It never writes the URL: XO closes overlays on any
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
