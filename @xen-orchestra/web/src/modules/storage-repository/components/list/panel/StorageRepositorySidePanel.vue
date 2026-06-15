<template>
  <VtsStateHero v-if="!isReady" format="panel" type="busy" size="medium" />
  <UiPanel v-else :key="panelSignature" :class="{ 'mobile-drawer': uiStore.isSmall }">
    <template #header>
      <VtsDeleteButton
        class="sr-delete-button"
        :disabled="!canDeleteSr"
        :busy="isDeletingSr"
        @click="openSrDeleteModal()"
      />
      <SrDisconnectButton class="sr-disconnect-button" :sr :scope />
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
      <StorageRepositoryInfosCard :sr :scope />
      <StorageRepositorySpaceCard :sr />
      <StorageRepositoryVdisCard :vdis />
      <StorageRepositoryHostsCard :hosts />
      <StorageRepositoryPbdsCard :sr :scope />
      <StorageRepositoryCustomFieldsCard :custom-fields />
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import { useXoHostCollection, type FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import SrDisconnectButton from '@/modules/storage-repository/components/actions/disconnect/SrDisconnectButton.vue'
import StorageRepositoryCustomFieldsCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryCustomFieldsCard.vue'
import StorageRepositoryHostsCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryHostsCard.vue'
import StorageRepositoryInfosCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryInfosCard.vue'
import StorageRepositoryPbdsCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryPbdsCard.vue'
import StorageRepositorySpaceCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositorySpaceCard.vue'
import StorageRepositoryVdisCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryVdisCard.vue'
import { useSrDeleteModal } from '@/modules/storage-repository/composables/use-sr-delete-modal.composable.ts'
import { useGetPbdsInScope } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { StorageScope } from '@/modules/storage-repository/types/storage-scope.type.ts'
import { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import VtsDeleteButton from '@core/components/delete-button/VtsDeleteButton.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import type { XoVdi } from '@vates/types'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { sr, scope } = defineProps<{
  sr: FrontXoSr
  scope: StorageScope
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const uiStore = useUiStore()

const { useGetVdisByIds, areVdisReady } = useXoVdiCollection()
const { getHostById, areHostsReady } = useXoHostCollection()
const { pbdsBySr, arePbdsReady } = useXoPbdCollection()

const isReady = logicAnd(areVdisReady, areHostsReady, arePbdsReady)

const vdis = useGetVdisByIds(() => sr.VDIs as XoVdi['id'][])

const { getSrPbdsSignature } = useGetPbdsInScope()

const panelSignature = computed(() => getSrPbdsSignature(sr, scope))

const pbds = computed(() => pbdsBySr.value.get(sr.id) ?? [])

const hosts = computed(() =>
  pbds.value.reduce<FrontXoHost[]>((acc, pbd) => {
    const host = getHostById(pbd.host)

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

const { openModal: openSrDeleteModal, canRun: canDeleteSr, isRunning: isDeletingSr } = useSrDeleteModal(() => [sr])
</script>

<style scoped lang="postcss">
.sr-disconnect-button {
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
