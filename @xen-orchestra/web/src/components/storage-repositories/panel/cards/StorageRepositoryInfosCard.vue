<template>
  <UiCard class="card-container">
    <UiCardTitle>
      <UiLink v-if="sr.name_label" size="small" icon="object:sr:muted" :href="`/#/srs/${sr.id}/general`">
        {{ sr.name_label }}
      </UiLink>
    </UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('id') }}</template>
        <template #value>{{ sr.id }}</template>
        <template #addons>
          <VtsCopyButton :value="sr.id" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('description') }}</template>
        <template #value>{{ sr.name_description }}</template>
        <template #addons>
          <VtsCopyButton :value="sr.name_description" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('tags') }}</template>
        <template #value>
          <UiTagsList v-if="sr.tags.length > 0">
            <UiTag v-for="(tag, index) in sr.tags" :key="index" accent="info" variant="secondary">
              {{ tag }}
            </UiTag>
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
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoSr } from '@/types/xo/sr.type'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { sr } = defineProps<{
  sr: XoSr
}>()

const { t } = useI18n()

// TODO: compute connection status

const isSrSharedI18nValue = computed(() => (sr.shared ? t('shared') : t('unshared')))

const provisioning = computed(() => {
  return sr.allocationStrategy ?? t('unknown')
})
</script>

<style scoped lang="postcss">
.card-container {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
