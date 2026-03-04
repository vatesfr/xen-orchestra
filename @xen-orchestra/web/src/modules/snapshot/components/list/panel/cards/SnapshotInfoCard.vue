<template>
  <UiCard class="card-container">
    <div class="identity">
      <UiLink icon="object:vm" size="medium" :href="xo5VmSnapshotHref">{{ snapshot.name_label }}</UiLink>
      <VtsCodeSnippet :content="snapshot.id" copy />
    </div>
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
        <template v-if="snapshot.snapshot_time" #addons>
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
import {
  type FrontXoSchedule,
  useXoScheduleCollection,
} from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCodeSnippet from '@core/components/code-snippet/VtsCodeSnippet.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { icon } from '@core/icons'
import { VM_POWER_STATE } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { snapshot } = defineProps<{ snapshot: FrontXoVmSnapshot }>()

const { t, d } = useI18n()

const { getScheduleById } = useXoScheduleCollection()

const { buildXo5Route } = useXoRoutes()

const xo5VmSnapshotHref = computed(() =>
  buildXo5Route(`/vms/${snapshot.$snapshot_of}/snapshots?s=1_0_asc-${snapshot.id}`)
)

const formattedDate = computed(() =>
  d(snapshot.snapshot_time * 1000, { dateStyle: 'short', timeStyle: 'medium' }).replace(/\//g, '-')
)

const memoryAccent = computed(() => {
  return snapshot.power_state === VM_POWER_STATE.SUSPENDED ? 'success' : 'muted'
})

const memoryLabel = computed(() => {
  return snapshot.power_state === VM_POWER_STATE.SUSPENDED ? 'included' : 'not-included'
})

const trigger = computed(() => {
  const scheduleId = snapshot.other?.['xo:backup:schedule'] as FrontXoSchedule['id']

  if (!scheduleId) {
    return { label: t('manual') }
  }

  const schedule = getScheduleById(scheduleId)

  const href = buildXo5Route(`/backup/${schedule?.jobId}/edit`)

  return {
    label: schedule?.name || scheduleId,
    href,
    icon: icon('object:backup-schedule'),
  }
})
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .identity {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
