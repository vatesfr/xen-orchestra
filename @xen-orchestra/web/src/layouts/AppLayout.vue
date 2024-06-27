<template>
  <CoreLayout>
    <template #app-logo>
      <RouterLink class="logo-link" to="/">
        <LogoTextOnly :short="uiStore.isMobile" class="logo" />
      </RouterLink>
    </template>
    <template #app-header>
      <UiButton :right-icon="faArrowUpRightFromSquare" level="tertiary">XO 5</UiButton>
      <ButtonIcon
        v-tooltip="{ content: $t('tasks.quick-view'), placement: 'bottom-end' }"
        :icon="faBarsProgress"
        size="large"
      />
      <AccountMenu />
    </template>
    <template #sidebar-header>
      <SidebarSearch v-model="filter" />
    </template>
    <template #sidebar-content>
      <TreeList v-if="!isReady">
        <TreeLoadingItem v-for="i in 5" :key="i" :icon="faCity" />
      </TreeList>
      <NoResults v-else-if="pools.length === 0" />
      <InfraPoolList v-else :pools />
    </template>
    <template #content>
      <slot />
    </template>
  </CoreLayout>
</template>

<script lang="ts" setup>
import AccountMenu from '@/components/account-menu/AccountMenu.vue'
import InfraPoolList from '@/components/infra/InfraPoolList.vue'
import LogoTextOnly from '@/components/LogoTextOnly.vue'
import NoResults from '@/components/NoResults.vue'
import SidebarSearch from '@/components/SidebarSearch.vue'
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { usePoolStore } from '@/stores/xo-rest-api/pool.store'
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import ButtonIcon from '@core/components/button/ButtonIcon.vue'
import UiButton from '@core/components/button/UiButton.vue'
import TreeList from '@core/components/tree/TreeList.vue'
import TreeLoadingItem from '@core/components/tree/TreeLoadingItem.vue'
import { defineTree } from '@core/composables/tree/define-tree'
import { useTreeFilter } from '@core/composables/tree-filter.composable'
import { useTree } from '@core/composables/tree.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import CoreLayout from '@core/layouts/CoreLayout.vue'
import { useUiStore } from '@core/stores/ui.store'
import { faArrowUpRightFromSquare, faBarsProgress, faCity } from '@fortawesome/free-solid-svg-icons'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'

const uiStore = useUiStore()

const { records: rawPools, isReady: isPoolReady } = usePoolStore().subscribe()
const { hostsByPool, isReady: isHostReady } = useHostStore().subscribe()
const { vmsByHost, hostLessVmsByPool, isReady: isVmReady } = useVmStore().subscribe()

const isReady = logicAnd(isPoolReady, isHostReady, isVmReady)

const { filter, predicate } = useTreeFilter()

const definitions = computed(() =>
  defineTree(
    rawPools.value,
    {
      getLabel: 'name_label',
      predicate,
    },
    pool => [
      ...defineTree(
        hostsByPool.value.get(pool.id) ?? [],
        {
          getLabel: 'name_label',
          predicate,
          discriminator: 'host',
        },
        host =>
          defineTree(vmsByHost.value.get(host.id) ?? [], {
            getLabel: 'name_label',
            predicate,
          })
      ),
      ...defineTree(hostLessVmsByPool.value.get(pool.id) ?? [], {
        getLabel: 'name_label',
        predicate,
        discriminator: 'vm',
      }),
    ]
  )
)

const { nodes: pools } = useTree(definitions)
</script>

<style lang="postcss" scoped>
.logo-link {
  display: flex;
  align-self: stretch;
  align-items: center;
}

.logo {
  height: 1.6rem;
}
</style>
