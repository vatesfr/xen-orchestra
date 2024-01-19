<template>
  <ul class="infra-host-list">
    <li v-if="hasError" class="text-error">
      {{ $t('error-no-data') }}
    </li>
    <li v-else-if="!isReady">{{ $t('loading-hosts') }}</li>
    <template v-else>
      <InfraHostItem v-for="host in hosts" :key="host.$ref" :host-opaque-ref="host.$ref" />
    </template>
  </ul>
</template>

<script lang="ts" setup>
import InfraHostItem from '@/components/infra/InfraHostItem.vue'
import { useHostCollection } from '@/stores/xen-api/host.store'

const { records: hosts, isReady, hasError } = useHostCollection()
</script>

<style lang="postcss" scoped>
.text-error {
  padding-left: 3rem;
  font-weight: 700;
  font-size: 16px;
  line-height: 150%;
  color: var(--color-red-base);
}
</style>
