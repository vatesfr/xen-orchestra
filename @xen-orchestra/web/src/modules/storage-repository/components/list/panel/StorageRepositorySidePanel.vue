<template>
  <VtsStateHero v-if="!isReady" format="panel" type="busy" size="medium" />
  <UiPanel v-else :class="{ 'mobile-drawer': uiStore.isMobile }">
    <template #header>
      <div :class="{ 'action-buttons-container': uiStore.isMobile }">
        <UiButtonIcon
          v-tooltip="t('action:close')"
          size="small"
          variant="tertiary"
          accent="brand"
          :icon="uiStore.isMobile ? 'fa:angle-left' : 'fa:close'"
          @click="emit('close')"
        />
      </div>
    </template>
    <template #default>
      <StorageRepositoryInfosCard :sr />
      <StorageRepositorySpaceCard :sr />
      <StorageRepositoryVdisCard :vdis />
      <StorageRepositoryHostsCard :hosts />
      <StorageRepositoryPbdsCard :pbds />
      <StorageRepositoryCustomFieldsCard :custom-fields />
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import StorageRepositoryCustomFieldsCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryCustomFieldsCard.vue'
import StorageRepositoryHostsCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryHostsCard.vue'
import StorageRepositoryInfosCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryInfosCard.vue'
import StorageRepositoryPbdsCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryPbdsCard.vue'
import StorageRepositorySpaceCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositorySpaceCard.vue'
import StorageRepositoryVdisCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryVdisCard.vue'
import { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import type { XoHost, XoSr, XoVdi } from '@vates/types'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { sr } = defineProps<{
  sr: XoSr
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

const pbds = computed(() => pbdsBySr.value.get(sr.id) ?? [])

const hosts = computed(() =>
  pbds.value.reduce<XoHost[]>((acc, pbd) => {
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
</script>

<style scoped lang="postcss">
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
