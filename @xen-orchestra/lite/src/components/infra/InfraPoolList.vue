<template>
  <VtsTreeList class="infra-pool-list">
    <VtsTreeItem :expanded="isExpanded">
      <VtsTreeItemError v-if="hasError">
        {{ $t('error-no-data') }}
      </VtsTreeItemError>
      <VtsTreeLoadingItem v-else-if="!isReady || pool === undefined" :icon="faCity" />
      <UiTreeItemLabel
        v-else
        :icon="faCity"
        :route="{ name: 'pool.dashboard', params: { uuid: pool.uuid } }"
        @toggle="toggle()"
      >
        {{ pool.name_label || '(Pool)' }}
      </UiTreeItemLabel>
      <template #sublist>
        <VtsTreeList>
          <InfraHostItems />
          <InfraVmItems />
        </VtsTreeList>
      </template>
    </VtsTreeItem>
  </VtsTreeList>
</template>

<script lang="ts" setup>
import InfraHostItems from '@/components/infra/InfraHostItems.vue'
import InfraVmItems from '@/components/infra/InfraVmItems.vue'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import VtsTreeItemError from '@core/components/tree/VtsTreeItemError.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import VtsTreeLoadingItem from '@core/components/tree/VtsTreeLoadingItem.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { faCity } from '@fortawesome/free-solid-svg-icons'
import { useToggle } from '@vueuse/shared'

const { isReady, hasError, pool } = usePoolStore().subscribe()

const [isExpanded, toggle] = useToggle(true)
</script>
