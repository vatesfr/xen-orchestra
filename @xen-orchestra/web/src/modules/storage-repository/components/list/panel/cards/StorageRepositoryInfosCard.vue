<template>
  <UiCard class="card-container">
    <UiCardTitle>
      <UiLink v-if="sr.name_label" size="small" :icon="srStatusIcon" :href>
        {{ sr.name_label }}
      </UiLink>
    </UiCardTitle>
    <div class="content">
      <VtsCodeSnippet :content="sr.id" copy />
      <VtsCardRowKeyValue>
        <template #key>{{ t('status') }}</template>
        <template #value>
          <VtsStatus :status="srConnectionStatus" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue truncate align-top>
        <template #key>{{ t('description') }}</template>
        <template #value>{{ sr.name_description }}</template>
        <template v-if="sr.name_description" #addons>
          <VtsCopyButton :value="sr.name_description" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue align-top>
        <template #key>{{ t('tags') }}</template>
        <template #value>
          <UiTagsList v-if="sr.tags.length > 0">
            <VtsTag v-for="tag in sr.tags" :key="tag" :value="tag" />
          </UiTagsList>
        </template>
        <template v-if="sr.tags.length > 0" #addons>
          <VtsCopyButton :value="sr.tags.join(', ')" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('storage-format') }}</template>
        <template #value>{{ sr.SR_type }}</template>
        <template #addons>
          <VtsCopyButton :value="sr.SR_type" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('access-mode') }}</template>
        <template #value>{{ isSrSharedI18nValue }}</template>
        <template #addons>
          <VtsCopyButton :value="isSrSharedI18nValue" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('provisioning') }}</template>
        <template #value>{{ provisioning }}</template>
        <template #addons>
          <VtsCopyButton :value="provisioning" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('high-availability') }}</template>
        <template #value><VtsStatus :status="isHaSr" /></template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import {
  type FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { SrScope } from '@/modules/storage-repository/types/storage-repository.type'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCodeSnippet from '@core/components/code-snippet/VtsCodeSnippet.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { sr, scope } = defineProps<{
  sr: FrontXoSr
  scope: SrScope
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()
const href = computed(() => buildXo5Route(`/srs/${sr.id}/general`))

const { isHighAvailabilitySr } = useXoSrCollection()

const { srConnectionStatus, srStatusIcon } = useXoSrUtils(
  () => sr,
  () => scope
)

const isSrSharedI18nValue = computed(() => (sr.shared ? t('shared') : t('local')))

const provisioning = computed(() => {
  return sr.allocationStrategy ?? t('unknown')
})

const isHaSr = isHighAvailabilitySr(() => sr)
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
