<template>
  <UiCard class="card-container">
    <UiCardTitle>
      <div v-if="sr.name_label" class="title">
        <VtsIcon :name="srStatusIcon" size="medium" />
        {{ sr.name_label }}
      </div>
    </UiCardTitle>
    <div class="content">
      <VtsCodeSnippet :content="sr.uuid" copy />
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
        <template #value>{{ sr.type }}</template>
        <template #addons>
          <VtsCopyButton :value="sr.type" />
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
import type { XenApiPool, XenApiSr } from '@/libs/xen-api/xen-api.types.ts'
import { useSrUtils } from '@/modules/storage-repository/composables/sr-utils.composable.ts'
import { useSrStore } from '@/stores/xen-api/sr.store.ts'
import type { SrScope } from '@core/types/storage-repository.type.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCodeSnippet from '@core/components/code-snippet/VtsCodeSnippet.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { sr, pool, scope } = defineProps<{
  sr: XenApiSr
  pool: XenApiPool
  scope: SrScope
}>()

const { t } = useI18n()

const { isHaSr: isHaSrForPool } = useSrStore().subscribe()

const { srConnectionStatus, srStatusIcon } = useSrUtils(
  () => sr,
  () => scope
)

const isSrSharedI18nValue = computed(() => (sr.shared ? t('shared') : t('local')))

const provisioning = computed(() => sr.sm_config.type ?? t('unknown'))

const isHaSr = computed(() => isHaSrForPool(sr, pool))
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .title {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
