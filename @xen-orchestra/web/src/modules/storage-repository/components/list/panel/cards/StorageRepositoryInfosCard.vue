<template>
  <UiCard class="card-container">
    <UiCardTitle>
      <UiLink v-if="props.sr.name_label" size="small" :icon="srStatusIcon" :href>
        {{ props.sr.name_label }}
      </UiLink>
    </UiCardTitle>
    <div class="content">
      <VtsCodeSnippet :content="props.sr.id" copy />
      <VtsCardRowKeyValue>
        <template #key>{{ t('status') }}</template>
        <template #value>
          <VtsStatus :status="pbdsConnectionStatus" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue truncate align-top>
        <template #key>{{ t('description') }}</template>
        <template #value>{{ props.sr.name_description }}</template>
        <template v-if="props.sr.name_description" #addons>
          <VtsCopyButton :value="props.sr.name_description" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue align-top>
        <template #key>{{ t('tags') }}</template>
        <template #value>
          <UiTagsList v-if="props.sr.tags.length > 0">
            <VtsTag v-for="tag in props.sr.tags" :key="tag" :value="tag" />
          </UiTagsList>
        </template>
        <template v-if="props.sr.tags.length > 0" #addons>
          <VtsCopyButton :value="props.sr.tags.join(', ')" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('storage-format') }}</template>
        <template #value>{{ props.sr.SR_type }}</template>
        <template #addons>
          <VtsCopyButton :value="props.sr.SR_type" />
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
import type { StorageScope } from '@/modules/storage-repository/types/storage-scope.type.ts'
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

const props = defineProps<{
  sr: FrontXoSr
  scope: StorageScope
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()
const href = computed(() => buildXo5Route(`/srs/${props.sr.id}/general`))

const { isHighAvailabilitySr } = useXoSrCollection()

const { pbdsConnectionStatus, srStatusIcon } = useXoSrUtils(
  () => props.sr,
  () => props.scope
)

const isSrSharedI18nValue = computed(() => (props.sr.shared ? t('shared') : t('local')))

const provisioning = computed(() => {
  return props.sr.allocationStrategy ?? t('unknown')
})

const isHaSr = isHighAvailabilitySr(() => props.sr)
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
