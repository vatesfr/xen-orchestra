<template>
  <UiCard class="card-container">
    <VtsCardObjectTitle
      :id="snapshot.id"
      :label="snapshot.name_label"
      :href="buildXo5VmSnapshotRoute(snapshot.$snapshot_of, snapshot.id)"
      icon="object:vm"
    />
    <div class="content">
      <!-- DESCRIPTION -->
      <VtsCardRowKeyValue truncate align-top>
        <template #key>
          {{ t('description') }}
        </template>
        <template #value>{{ snapshot.name_description }}</template>
        <template v-if="snapshot.name_description" #addons>
          <VtsCopyButton :value="snapshot.name_description" />
        </template>
      </VtsCardRowKeyValue>
      <!-- CREATION DATE -->
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('creation-date') }}
        </template>
        <template #value>
          {{ formattedDate }}
        </template>
        <template #addons>
          <VtsCopyButton :value="formattedDate" />
        </template>
      </VtsCardRowKeyValue>
      <!-- TRIGGER -->
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('trigger') }}
        </template>
        <template #value>
          <UiLink v-if="snapshot.other?.['xo:backup:schedule']" size="small" :icon="trigger.icon" :href="trigger.href">
            {{ trigger.label }}
          </UiLink>
          <span v-else>
            {{ trigger.label }}
          </span>
        </template>
        <template #addons>
          <VtsCopyButton :value="trigger.label" />
        </template>
      </VtsCardRowKeyValue>
      <!-- MEMORY -->
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('memory') }}
        </template>
        <template #value>
          <UiInfo :accent="memoryAccent" size="medium">
            {{ t(memoryLabel) }}
          </UiInfo>
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { useSnapshotTrigger } from '@/modules/snapshot/composables/xo-snapshot-trigger.composable.ts'
import { useXo5VmSnapshotRoute } from '@/modules/snapshot/composables/xo-vm-snapshot-route-xo5.composable.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardObjectTitle from '@core/components/card-object-title/VtsCardObjectTitle.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { VM_POWER_STATE } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { snapshot } = defineProps<{ snapshot: FrontXoVmSnapshot }>()

const { t, d } = useI18n()

const { getSnapshotTrigger } = useSnapshotTrigger()

const { buildXo5VmSnapshotRoute } = useXo5VmSnapshotRoute()

const formattedDate = computed(() => d(snapshot.snapshot_time * 1000, { dateStyle: 'short', timeStyle: 'medium' }))

const memoryAccent = computed(() => (snapshot.power_state === VM_POWER_STATE.SUSPENDED ? 'success' : 'muted'))

const memoryLabel = computed(() => (snapshot.power_state === VM_POWER_STATE.SUSPENDED ? 'included' : 'not-included'))

const trigger = computed(() => getSnapshotTrigger(snapshot))
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
