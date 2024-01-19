<template>
  <ul class="infra-pool-list">
    <li v-if="hasError" class="text-error">
      {{ $t('error-no-data') }}
    </li>
    <InfraLoadingItem v-else-if="!isReady || pool === undefined" :icon="faBuilding" />
    <li v-else class="infra-pool-item">
      <InfraItemLabel :icon="faBuilding" :route="{ name: 'pool.dashboard', params: { uuid: pool.uuid } }" active>
        {{ pool.name_label || '(Pool)' }}
      </InfraItemLabel>

      <InfraHostList />

      <InfraVmList />
    </li>
  </ul>
</template>

<script lang="ts" setup>
import InfraHostList from '@/components/infra/InfraHostList.vue'
import InfraItemLabel from '@/components/infra/InfraItemLabel.vue'
import InfraLoadingItem from '@/components/infra/InfraLoadingItem.vue'
import InfraVmList from '@/components/infra/InfraVmList.vue'
import { usePoolCollection } from '@/stores/xen-api/pool.store'
import { faBuilding } from '@fortawesome/free-regular-svg-icons'

const { isReady, hasError, pool } = usePoolCollection()
</script>

<style lang="postcss" scoped>
.infra-pool-list {
  font-size: 1.6rem;
  font-weight: 500;
}

.infra-vm-list:deep(.link),
.infra-vm-list:deep(.link-placeholder) {
  padding-left: 2rem;
}

.text-error {
  padding-left: 3rem;
  font-weight: 700;
  font-size: 16px;
  line-height: 150%;
  color: var(--color-red-base);
}
</style>
