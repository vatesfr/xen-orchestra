<template>
  <VtsTreeList class="infra-pool-list">
    <VtsTreeItem :expanded="isExpanded" :node-id="`pool:${pool?.uuid}`">
      <VtsTreeItemError v-if="hasError">
        {{ t('error-no-data') }}
      </VtsTreeItemError>
      <VtsTreeLoadingItem v-else-if="!isReady || pool === undefined" icon="object:pool" />
      <UiTreeItemLabel
        v-else
        :route="{ name: '/pool/[uuid]', params: { uuid: pool.uuid } }"
        icon="object:pool"
        @toggle="toggle()"
      >
        {{ pool.name_label || '(Pool)' }}
        <template #addons>
          <MenuList placement="bottom-start">
            <template #trigger="{ open, isOpen }">
              <UiButtonIcon
                accent="brand"
                icon="action:more-actions"
                variant="tertiary"
                size="small"
                :selected="isOpen"
                @click="open($event)"
              />
            </template>
            <PoolTreeActions :pool />
          </MenuList>
        </template>
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
import PoolTreeActions from '@/modules/pool/components/actions/poolTreeActions.vue'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import VtsTreeItemError from '@core/components/tree/VtsTreeItemError.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import VtsTreeLoadingItem from '@core/components/tree/VtsTreeLoadingItem.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { useToggle } from '@vueuse/shared'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { isReady, hasError, pool } = usePoolStore().subscribe()

const [isExpanded, toggle] = useToggle(true)
</script>
