<template>
  <UiDrawer class="v2v-vm-settings-drawer" @confirm="emit('confirm', toOverrides())" @dismiss="emit('cancel')">
    <template #title>
      {{ t('action:edit-vm-settings', { name: vm.name }) }}
    </template>

    <template #content>
      <div class="sections">
        <section v-if="diskRows.length > 0" class="section">
          <UiTitle>{{ t('disks') }}</UiTitle>
          <V2vDiskMappingTable
            :rows="diskRows"
            :sr-options
            :loading="!areOffersReady"
            @change-sr="(key, srId) => setDiskSr(key, srId)"
          />
        </section>
        <section v-if="nicRows.length > 0" class="section">
          <UiTitle>{{ t('network-adapters') }}</UiTitle>
          <V2vNicMappingTable
            :rows="nicRows"
            :network-options
            :loading="!areOffersReady"
            @change-network="(key, networkId) => setNicNetwork(key, networkId)"
          />
        </section>
        <section class="section">
          <UiTitle>{{ t('options') }}</UiTitle>
          <V2vVmOptionsFields
            :keep-mac
            :template
            :template-options
            :tags
            :loading="!areOffersReady"
            @change-keep-mac="value => setKeepMac(value)"
            @change-template="templateId => setTemplate(templateId)"
            @change-tags="value => setTags(value)"
          />
        </section>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton :disabled="!areOffersReady">
        {{ t('action:save') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import V2vDiskMappingTable from '@/modules/v2v/components/mapping/V2vDiskMappingTable.vue'
import V2vNicMappingTable from '@/modules/v2v/components/mapping/V2vNicMappingTable.vue'
import V2vVmOptionsFields from '@/modules/v2v/components/mapping/V2vVmOptionsFields.vue'
import { useV2vVmMappingDraft } from '@/modules/v2v/composables/use-v2v-vm-mapping-draft.composable.ts'
import type { V2vVmOverrides } from '@/modules/v2v/composables/use-v2v-vm-mapping.composable.ts'
import type { V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { XoV2vInventory, XoV2vVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { vm, list, inventory } = defineProps<{
  vm: XoV2vVm
  list: V2vMigrationList
  inventory: XoV2vInventory | undefined
}>()

const emit = defineEmits<{
  confirm: [overrides: V2vVmOverrides]
  cancel: []
}>()

const { t } = useI18n()

const {
  diskRows,
  nicRows,
  template,
  srOptions,
  networkOptions,
  templateOptions,
  areOffersReady,
  keepMac,
  tags,
  setDiskSr,
  setNicNetwork,
  setTemplate,
  setKeepMac,
  setTags,
  toOverrides,
} = useV2vVmMappingDraft(() => vm, { list: () => list, inventory: () => inventory })
</script>

<style lang="postcss" scoped>
.v2v-vm-settings-drawer {
  .sections {
    display: flex;
    flex-direction: column;
    gap: 4.8rem;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }
}
</style>
