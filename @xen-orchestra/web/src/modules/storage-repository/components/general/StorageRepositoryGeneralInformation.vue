<template>
  <UiCard>
    <UiTitle>
      {{ t('general-information') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('name')" :value="sr.name_label" />
      <VtsTabularKeyValueRow :label="t('uuid')" :value="sr.id" />
      <VtsTabularKeyValueRow :label="t('description')" :value="sr.name_description" />
      <VtsTabularKeyValueRow :label="t('tags')">
        <template #value>
          <UiTagsList v-if="sr.tags.length > 0">
            <VtsTag v-for="tag in sr.tags" :key="tag" :value="tag" />
          </UiTagsList>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('status')">
        <template #value>
          <VtsStatus :status="allPbdsConnectionStatus" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('storage-format')" :value="sr.SR_type" />
      <VtsTabularKeyValueRow :label="t('supported-image-formats')" :value="supportedImageFormats" />
      <VtsTabularKeyValueRow :label="t('access-mode')" :value="isSrSharedI18nValue" />
      <VtsTabularKeyValueRow :label="t('provisioning')" :value="provisioning" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoPbdUtils } from '@/modules/pbd/composables/xo-pbd-utils.composable.ts'
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import { useXoSmCollection } from '@/modules/sm/remote-resources/use-xo-sm-collection.ts'
import { type FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { sr } = defineProps<{
  sr: FrontXoSr
}>()

const { t } = useI18n()

const { sms } = useXoSmCollection()

const { getPbdsByIds } = useXoPbdCollection()

const { allPbdsConnectionStatus } = useXoPbdUtils(() => getPbdsByIds(sr.$PBDs))

const isSrSharedI18nValue = computed(() => (sr.shared ? t('shared') : t('local')))

const provisioning = computed(() => sr.allocationStrategy ?? t('unknown'))

const supportedImageFormats = computed(() => {
  const sm = sms.value.find(sm => sm.SM_type === sr.SR_type && sm.$pool === sr.$pool)
  const formats = sm?.supported_image_formats
  return formats !== undefined && formats.length > 0 ? formats.join(', ').toUpperCase() : 'VHD'
})
</script>
