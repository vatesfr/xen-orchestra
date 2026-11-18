<template>
  <UiCard>
    <UiTitle>
      {{ t('schedule') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('name')">
        <template v-if="schedule !== undefined" #value>
          <UiLink size="medium" icon="object:backup-schedule" :href="jobOverviewHref">
            {{ schedule.name || t('untitled') }}
          </UiLink>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('id')">
        <template v-if="scheduleId !== undefined" #value>
          <VtsCodeSnippet :content="scheduleId" />
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import {
  type FrontXoSchedule,
  useXoScheduleCollection,
} from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsCodeSnippet from '@core/components/code-snippet/VtsCodeSnippet.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupLog } = defineProps<{ backupLog: FrontXoBackupLog }>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()

const { useGetScheduleById } = useXoScheduleCollection()

const scheduleId = computed(() => backupLog.scheduleId as FrontXoSchedule['id'] | undefined)

const schedule = useGetScheduleById(scheduleId)

const jobOverviewHref = computed(() => buildXo5Route('/backup/overview'))
</script>
