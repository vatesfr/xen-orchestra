<template>
  <TreeItemError v-if="hasError">
    {{ $t('error-no-data') }}
  </TreeItemError>
  <TreeLoadingItem v-else-if="!isReady" :icon="faServer">{{ $t('loading-hosts') }}</TreeLoadingItem>
  <InfraHostItem v-for="host in hosts" :key="host.$ref" :host-opaque-ref="host.$ref" />
</template>

<script lang="ts" setup>
import InfraHostItem from '@/components/infra/InfraHostItem.vue'
import { useHostStore } from '@/stores/xen-api/host.store'
import TreeItemError from '@core/components/tree/TreeItemError.vue'
import TreeLoadingItem from '@core/components/tree/TreeLoadingItem.vue'
import { faServer } from '@fortawesome/free-solid-svg-icons'

const { records: hosts, isReady, hasError } = useHostStore().subscribe()
</script>
