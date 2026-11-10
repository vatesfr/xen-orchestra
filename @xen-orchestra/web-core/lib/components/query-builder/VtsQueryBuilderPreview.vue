<template>
  <div class="vts-query-builder-preview">
    <UiLabel accent="neutral">{{ t('query-preview') }}</UiLabel>

    <UiCard class="card">
      <div class="row">
        <span class="row-label typo-body-regular">{{ t('scope') }}</span>
        <VtsQueryBuilderPreviewGroup v-if="isUsable" :group="rootGroup" :prefix="t('query-preview:where')" />
        <span v-else class="typo-body-regular">{{ t('query-preview:unable-to-display-scope') }}</span>
      </div>

      <div class="row">
        <span class="row-label typo-body-regular">{{ t('selector') }}</span>
        <div class="selector">
          <code class="selector-code typo-form-value-small">{{ selector }}</code>
          <div class="selector-actions">
            <VtsCopyButton :value="selector" />
            <UiButtonIcon
              icon="fa:arrow-up-right-from-square"
              size="small"
              accent="brand"
              :disabled="selector === ''"
              @click="openSelectorInNewTab()"
            />
          </div>
        </div>
      </div>

      <div class="row">
        <span class="row-label typo-body-regular">{{ t('scope-preview') }}</span>
        <span v-if="!isUsable" class="typo-body-regular">{{ t('query-preview:unable-to-preview-scope') }}</span>
        <span v-else-if="items.length === 0" class="typo-body-regular">{{ t('query-preview:no-match') }}</span>
        <div v-else class="items">
          <span class="count typo-body-regular-small">{{ countLabel }}</span>
          <UiCollapsibleList tag="div" :total-items="items.length">
            <UiObjectLink v-for="item of items" :key="item.id" :route="item.route" :icon="item.icon">
              {{ item.label }}
            </UiObjectLink>
          </UiCollapsibleList>
        </div>
      </div>
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsQueryBuilderPreviewGroup from '@core/components/query-builder/VtsQueryBuilderPreviewGroup.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
import type { IconName } from '@core/icons'
import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { useQueryBuilder } from '@core/packages/query-builder/use-query-builder.ts'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

export type QueryBuilderPreviewItem = {
  id: string
  label: string
  icon: IconName
  route: RouteLocationRaw
}

const { filter, schema, items } = defineProps<{
  filter: string
  schema: QueryBuilderSchema
  items: QueryBuilderPreviewItem[]
  countLabel: string
}>()

const { t } = useI18n()

const filterModel = ref(filter)

watch(
  () => filter,
  value => (filterModel.value = value)
)

const { rootGroup, isUsable } = useQueryBuilder(filterModel, () => schema)

const selector = computed(() => {
  if (!isUsable.value || items.length === 0) {
    return ''
  }

  const uuids = items.map(item => `uuid:${item.id}`)

  return uuids.length === 1 ? uuids[0] : `|(${uuids.join('\n')})`
})

function openSelectorInNewTab() {
  const pre = document.createElement('pre')
  pre.textContent = selector.value
  window.open('', '_blank')?.document.body.appendChild(pre)
}
</script>

<style lang="postcss" scoped>
.vts-query-builder-preview {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .card {
    padding: 1.6rem 2.4rem;
  }

  .row {
    display: grid;
    grid-template-columns: 16rem 1fr;
    align-items: start;
    gap: 1.6rem;
  }

  .row-label {
    color: var(--color-neutral-txt-secondary);
  }

  .selector {
    display: flex;
    align-items: flex-start;
    gap: 0.8rem;
  }

  .selector-code {
    flex: 1;
    min-height: 3.2rem;
    max-height: 16rem;
    overflow-y: auto;
    padding: 0.8rem 1.2rem;
    white-space: pre-wrap;
    word-break: break-all;
    border-inline-start: 0.2rem solid var(--color-info-item-base);
    background-color: var(--color-neutral-background-disabled);
  }

  .selector-actions {
    display: flex;
    gap: 0.4rem;
  }

  .items {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .count {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
