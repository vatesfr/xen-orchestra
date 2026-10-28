<template>
  <div class="v2v-new-vm-mapping">
    <V2vMappingVmHeader :heading action="remove" @remove="emit('remove')" />
    <div class="content">
      <div class="cards">
        <V2vVmSourceCard :vm :host-name />
        <V2vVmChecksCard :checks />
      </div>
      <V2vDestinationMappingCard
        :pool-name
        :disk-rows
        :nic-rows
        :sr-options
        :network-options
        :loading="!areOffersReady"
        @change-disk-sr="(key, srId) => setDiskSr(key, srId)"
        @change-nic-network="(key, networkId) => setNicNetwork(key, networkId)"
      />
      <V2vVmOptionsCard
        :keep-mac
        :template
        :template-options
        :tags
        :loading="!areOffersReady"
        @change-keep-mac="value => setKeepMac(value)"
        @change-template="templateId => setTemplate(templateId)"
        @change-tags="value => setTags(value)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import V2vDestinationMappingCard from '@/modules/v2v/components/mapping/V2vDestinationMappingCard.vue'
import V2vMappingVmHeader from '@/modules/v2v/components/mapping/V2vMappingVmHeader.vue'
import V2vVmChecksCard from '@/modules/v2v/components/mapping/V2vVmChecksCard.vue'
import V2vVmOptionsCard from '@/modules/v2v/components/mapping/V2vVmOptionsCard.vue'
import V2vVmSourceCard from '@/modules/v2v/components/mapping/V2vVmSourceCard.vue'
import type { V2vMappingVmHeading } from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import type { V2vAccentedLabel } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import { useV2vVmMapping, type V2vVmMappingContext } from '@/modules/v2v/composables/use-v2v-vm-mapping.composable.ts'
import type { V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import type { InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import type { XoV2vVm } from '@vates/types'

const { vm, list, listIssue, updateVm } = defineProps<{
  heading: V2vMappingVmHeading
  vm: XoV2vVm
  list: V2vMigrationList
  listIssue?: V2vAccentedLabel<InfoAccent>
  updateVm: V2vVmMappingContext['updateVm']
}>()

const emit = defineEmits<{
  remove: []
}>()

const {
  poolName,
  hostName,
  checks,
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
} = useV2vVmMapping(() => vm, { list: () => list, updateVm, listIssue: () => listIssue })
</script>

<style lang="postcss" scoped>
.v2v-new-vm-mapping {
  display: flex;
  flex-direction: column;

  .content {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    padding: 1.6rem;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(38rem, 100%), 1fr));
    align-items: start;
    gap: 1.6rem;
  }
}
</style>
