<template>
  <TreeList class="infra-pool-list">
    <TreeItem :expanded="isExpanded">
      <TreeItemError v-if="hasError">
        {{ $t('error-no-data') }}
      </TreeItemError>
      <TreeLoadingItem v-else-if="!isReady || pool === undefined" :icon="faCity" />
      <TreeItemLabel
        v-else
        :icon="faCity"
        :route="{ name: 'pool.dashboard', params: { uuid: pool.uuid } }"
        @toggle="toggle()"
      >
        {{ pool.name_label || '(Pool)' }}
      </TreeItemLabel>
      <template #sublist>
        <TreeList>
          <InfraHostItems />
          <InfraVmItems />
        </TreeList>
      </template>
    </TreeItem>
  </TreeList>
</template>

<script lang="ts" setup>
import InfraHostItems from '@/components/infra/InfraHostItems.vue'
import InfraVmItems from '@/components/infra/InfraVmItems.vue'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import TreeItem from '@core/components/tree/TreeItem.vue'
import TreeItemError from '@core/components/tree/TreeItemError.vue'
import TreeItemLabel from '@core/components/tree/TreeItemLabel.vue'
import TreeList from '@core/components/tree/TreeList.vue'
import TreeLoadingItem from '@core/components/tree/TreeLoadingItem.vue'
import { faCity } from '@fortawesome/free-solid-svg-icons'
import { useToggle } from '@vueuse/shared'

const { isReady, hasError, pool } = usePoolStore().subscribe()

const [isExpanded, toggle] = useToggle(true)
</script>
