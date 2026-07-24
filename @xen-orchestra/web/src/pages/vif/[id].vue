<template>
  <VtsStateHero v-if="!areVifsReady || !areVmsReady" format="page" type="busy" size="large" />
  <VtsStateHero v-else-if="!vif" format="page" type="not-found" size="large">
    {{ t('object-not-found', { id: route.params.id }) }}
  </VtsStateHero>
  <RouterView v-else v-slot="{ Component }">
    <MenuPanel
      :current-page="activeChild?.title ?? ''"
      :title="t('vif-device', { device: vif.device })"
      icon="object:vif"
      @back="back()"
    >
      <template #header>
        <VifHeader :vif />
      </template>
      <template #menu>
        <MenuList v-if="!uiStore.isSmall" class="menu vif-menu">
          <MenuTrigger
            v-for="child in children"
            :key="child.name"
            :active="activeChild == child"
            @click="navigateToChild(child)"
          >
            {{ child.title }}
          </MenuTrigger>
        </MenuList>
        <ul v-else>
          <!-- TODO: MenuItem must be small when component is updated remove forced style -->
          <li v-for="child in children" :key="child.name" class="list-menu-item">
            <MenuItem @click="navigateToChild(child)">
              {{ child.title }}
            </MenuItem>
          </li>
        </ul>
      </template>
      <component :is="Component" :vif />
    </MenuPanel>
  </RouterView>
</template>

<script lang="ts" setup>
import VifHeader from '@/modules/vif/components/VifHeader.vue'
import { type FrontXoVif, useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection'
import type { IconName } from '@core/icons'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import MenuPanel from '@core/components/menu/menuPanel.vue'
import MenuTrigger from '@core/components/menu/MenuTrigger.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'
import { useUiStore } from '@core/stores/ui.store'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

useDefaultTab('/vif/[id]', 'general')

const route = useRoute<'/vif/[id]'>()
const router = useRouter()
const uiStore = useUiStore()

const { t } = useI18n()

const { areVifsReady, useGetVifById } = useXoVifCollection()
const { areVmsReady, useGetVmById } = useXoVmCollection()

const vif = useGetVifById(() => route.params.id as FrontXoVif['id'])
const vm = useGetVmById(() => vif.value?.$VM)
const showMenu = ref(true)

const children = computed(() => [
  {
    name: '/vif/[id]/general',
    title: t('general'),
    icon: 'fa:info-circle' as IconName,
  },
  {
    name: '/vif/[id]/traffic-rules',
    title: t('traffic-rules'),
    icon: 'fa:traffic-light' as IconName,
  },
])

const activeChild = computed(() => {
  if (!route.name) return null
  return children.value.find(child => child.name === route.name) ?? null
})

const navigateToChild = (child: (typeof children.value)[0]) => {
  router.push({ name: child.name as '/vif/[id]/general' | '/vif/[id]/traffic-rules', params: { id: vif.value!.id } })
  showMenu.value = false
}

function back() {
  router.push(
    vm.value
      ? {
          name: '/vm/[id]/networks',
          params: { id: vm.value.id },
        }
      : '/'
  )
}
watch(
  () => uiStore.isSmall,
  isSmall => {
    if (!isSmall) {
      showMenu.value = false
    }
  }
)
</script>

<style lang="postcss" scoped>
.menu {
  .menu-trigger {
    text-wrap: nowrap;
    padding: 1.2rem 1.6rem;
  }
}

.list-menu-item {
  border-bottom: 0.1rem solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-primary);
}

.list-menu-item:first-child {
  border-top: 0.1rem solid var(--color-neutral-border);
}
</style>
