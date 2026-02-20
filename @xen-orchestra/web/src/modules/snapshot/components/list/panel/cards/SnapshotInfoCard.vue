<template>
  <UiCard class="card-container">
    <div class="identity">
      <UiLink icon="object:vm" size="medium" disabled>{{ snapshot.name_label }}</UiLink>
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
          <UiLink v-if="snapshot.other?.['xo:backup:schedule']" size="small" :icon="trigger.icon">
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
import { useXoScheduleCollection } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
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
  const scheduleId = snapshot.other?.['xo:backup:schedule']

  if (!scheduleId) {
    return { label: t('manual') }
  }

  const schedule = getScheduleById(scheduleId as any)

  return {
    label: schedule?.name || scheduleId,
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
