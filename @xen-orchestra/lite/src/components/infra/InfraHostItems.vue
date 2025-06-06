<template>
  <VtsTreeItemError v-if="hasError">
    {{ t('error-no-data') }}
  </VtsTreeItemError>
  <VtsTreeLoadingItem v-else-if="!isReady" :icon="faServer">{{ t('loading-hosts') }}</VtsTreeLoadingItem>
  <InfraHostItem v-for="host in hosts" :key="host.$ref" :host-opaque-ref="host.$ref" />
</template>

<script lang="ts" setup>
import InfraHostItem from '@/components/infra/InfraHostItem.vue'
import { useHostStore } from '@/stores/xen-api/host.store'
import VtsTreeItemError from '@core/components/tree/VtsTreeItemError.vue'
import VtsTreeLoadingItem from '@core/components/tree/VtsTreeLoadingItem.vue'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { records: hosts, isReady, hasError } = useHostStore().subscribe()
</script>
