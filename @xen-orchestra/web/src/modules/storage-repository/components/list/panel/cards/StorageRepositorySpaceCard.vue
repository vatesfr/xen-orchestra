<template>
  <VtsSpaceCard :used="sr.physical_usage" :total="sr.size" :label="sr.name_label" :total-size-label="t('total-space')">
    <template v-if="isUnwritableSr" #alert>
      <UiAlert accent="info">
        {{ t('sr-is-unwritable') }}
      </UiAlert>
    </template>
  </VtsSpaceCard>
</template>

<script lang="ts" setup>
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { isSrWritable } from '@/modules/storage-repository/utils/xo-sr.util.ts'
import VtsSpaceCard from '@core/components/space-card/VtsSpaceCard.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { sr } = defineProps<{
  sr: FrontXoSr
}>()

const { t } = useI18n()

const isUnwritableSr = computed(() => !isSrWritable(sr))
</script>
