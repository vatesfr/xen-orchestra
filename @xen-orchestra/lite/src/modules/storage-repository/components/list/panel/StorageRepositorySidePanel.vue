<template>
  <VtsStateHero v-if="!isReady" format="panel" type="busy" size="medium" />
  <UiPanel v-else :key="panelSignature" :class="{ 'mobile-drawer': uiStore.isSmall }">
    <template #header>
      <div class="action-buttons">
        <SrConnectButton :sr :scope />
        <MenuList placement="bottom-end">
          <template #trigger="{ open }">
            <UiButtonIcon icon="action:more-actions" accent="brand" size="medium" @click="open($event)" />
          </template>
          <SrDisconnectButton :sr :scope />
          <SrDeleteButton :sr />
        </MenuList>
      </div>

      <div :class="{ 'action-buttons-container': uiStore.isSmall }">
        <UiButtonIcon
          v-tooltip="t('action:close')"
          size="small"
          variant="tertiary"
          accent="brand"
          :icon="uiStore.isSmall ? 'fa:angle-left' : 'fa:close'"
          @click="emit('close')"
        />
      </div>
    </template>
    <template #default>
      <StorageRepositoryInfosCard :sr :pool :scope />
      <StorageRepositorySpaceCard :sr />
      <StorageRepositoryVdisCard :vdis />
      <StorageRepositoryHostsCard :hosts />
      <StorageRepositoryPbdsCard :sr :scope />
      <StorageRepositoryCustomFieldsCard :custom-fields />
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import type { XenApiHost, XenApiPool, XenApiSr, XenApiVdi } from '@/libs/xen-api/xen-api.types'
import SrConnectButton from '@/modules/storage-repository/components/actions/connect/SrConnectButton.vue'
import SrDeleteButton from '@/modules/storage-repository/components/actions/delete/SrDeleteButton.vue'
import SrDisconnectButton from '@/modules/storage-repository/components/actions/disconnect/SrDisconnectButton.vue'
import StorageRepositoryCustomFieldsCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryCustomFieldsCard.vue'
import StorageRepositoryHostsCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryHostsCard.vue'
import StorageRepositoryInfosCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryInfosCard.vue'
import StorageRepositoryPbdsCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryPbdsCard.vue'
import StorageRepositorySpaceCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositorySpaceCard.vue'
import StorageRepositoryVdisCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryVdisCard.vue'
import { useGetPbdsInScope } from '@/modules/storage-repository/composables/sr-utils.composable'
import type { SrScope } from '@/modules/storage-repository/types/storage-repository.type'
import { useHostStore } from '@/stores/xen-api/host.store'
import { usePbdStore } from '@/stores/xen-api/pbd.store'
import { useVdiStore } from '@/stores/xen-api/vdi.store'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useUiStore } from '@core/stores/ui.store.ts'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { sr, pool, scope } = defineProps<{
  sr: XenApiSr
  pool: XenApiPool
  scope: SrScope
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const uiStore = useUiStore()

const { getByOpaqueRef: getVdiByOpaqueRef, isReady: areVdisReady } = useVdiStore().subscribe()
const { getByOpaqueRef: getHostByOpaqueRef, isReady: areHostsReady } = useHostStore().subscribe()
const { getPbdsForSr, isReady: arePbdsReady } = usePbdStore().subscribe()

const isReady = logicAnd(areVdisReady, areHostsReady, arePbdsReady)

const vdis = computed(() =>
  sr.VDIs.map(vdiRef => getVdiByOpaqueRef(vdiRef)).filter((vdi): vdi is XenApiVdi => vdi !== undefined)
)

const { getSrPbdsSignature } = useGetPbdsInScope()

const panelSignature = computed(() => getSrPbdsSignature(sr, scope))

const pbds = computed(() => getPbdsForSr(sr.$ref))

const hosts = computed(() =>
  pbds.value.reduce<XenApiHost[]>((acc, pbd) => {
    const host = getHostByOpaqueRef(pbd.host)

    if (host !== undefined) {
      acc.push(host)
    }

    return acc
  }, [])
)

const customFields = computed(() => {
  const prefix = 'XenCenter.CustomFields.'

  return Object.entries(sr.other_config).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (key.startsWith(prefix)) {
      acc[key.slice(prefix.length)] = value
    }

    return acc
  }, {})
})
</script>

<style scoped lang="postcss">
.action-buttons {
  display: flex;
  align-items: center;
  margin-inline-end: auto;
}

.mobile-drawer {
  position: fixed;
  inset: 0;

  .action-buttons-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
}
</style>
