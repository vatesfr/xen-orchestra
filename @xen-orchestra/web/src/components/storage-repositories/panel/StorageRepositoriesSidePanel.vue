<template>
  <UiPanel :class="{ 'mobile-drawer': uiStore.isMobile }">
    <template #header>
      <div :class="{ 'action-buttons-container': uiStore.isMobile }">
        <UiButtonIcon
          v-tooltip="t('close')"
          size="medium"
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
      <StorageRepositoryVdisCard v-if="vdis.length > 0" :vdis />
      <StorageRepositoryHostsCard v-if="hosts.length > 0" :hosts />
      <StorageRepositoryPbdsCard v-if="pbds.length > 0" :pbds />
      <StorageRepositoryCustomFieldsCard :custom-fields="sr.other_config" />
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import StorageRepositoryCustomFieldsCard from '@/components/storage-repositories/panel/cards/StorageRepositoryCustomFieldsCard.vue'
import StorageRepositoryHostsCard from '@/components/storage-repositories/panel/cards/StorageRepositoryHostsCard.vue'
import StorageRepositoryInfosCard from '@/components/storage-repositories/panel/cards/StorageRepositoryInfosCard.vue'
import StorageRepositoryPbdsCard from '@/components/storage-repositories/panel/cards/StorageRepositoryPbdsCard.vue'
import StorageRepositorySpaceCard from '@/components/storage-repositories/panel/cards/StorageRepositorySpaceCard.vue'
import StorageRepositoryVdisCard from '@/components/storage-repositories/panel/cards/StorageRepositoryVdisCard.vue'
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection'
import { useXoPbdCollection } from '@/remote-resources/use-xo-pbd-collection'
import { useXoVdiCollection } from '@/remote-resources/use-xo-vdi-collection'
import type { XoHost } from '@/types/xo/host.type'
import type { XoSr } from '@/types/xo/sr.type.ts'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
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

const { useGetVdisByIds } = useXoVdiCollection()
const { getHostById } = useXoHostCollection()
const { pbds: rawPbds, getPbdsByIds } = useXoPbdCollection()

const vdis = useGetVdisByIds(() => sr.VDIs)

const hosts = computed(() => {
  const pbds = getPbdsByIds(sr.$PBDs)

  return pbds.reduce<XoHost[]>((acc, pbd) => {
    const host = getHostById(pbd.host)

    if (host !== undefined) {
      acc.push(host)
    }

    return acc
  }, [])
})

const pbds = computed(() => rawPbds.value.filter(pbd => pbd.SR === sr.id))
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
