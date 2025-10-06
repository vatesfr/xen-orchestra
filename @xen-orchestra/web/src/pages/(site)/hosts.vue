<template>
  <UiCard>
    <UiTitle>{{ t('hosts') }}</UiTitle>
    <HostsTable :hosts />
  </UiCard>
</template>

<script setup lang="ts">
import HostsTable from '@/components/host/hostsTable.vue'
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { hosts } = useXoHostCollection()
</script>
