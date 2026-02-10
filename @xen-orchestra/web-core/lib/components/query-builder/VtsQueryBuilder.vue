<template>
  <form class="vts-query-builder" @submit.prevent="handleSubmit()">
    <label :for="id" class="typo-body-regular-small label">
      {{ t('query-builder:label') }}
    </label>
    <div class="input-container">
      <UiInput
        v-model="localFilter"
        :accent="isUsable ? 'brand' : 'danger'"
        :aria-label="uiStore.isSmall ? t('query-builder:label') : undefined"
        :placeholder="t('query-builder:placeholder')"
        clearable
        @clear="filter = localFilter"
      />
    </div>

    <template v-if="uiStore.isSmallOrMedium">
      <UiButtonIcon icon="fa:magnifying-glass" size="medium" accent="brand" />
      <VtsQueryBuilderButton
        v-model="rootGroup"
        small
        :disabled="!isUsable"
        @confirm="updateFilter()"
        @cancel="resetFilter"
      />
    </template>
    <template v-else>
      <UiButton size="medium" accent="brand" variant="secondary" type="submit">
        {{ t('action:search') }}
      </UiButton>

      <VtsDivider type="stretch" />

      <VtsQueryBuilderButton
        v-model="rootGroup"
        :disabled="!isUsable"
        @confirm="updateFilter()"
        @cancel="resetFilter"
      />
    </template>
  </form>
</template>

<script setup lang="ts">
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsQueryBuilderButton from '@core/components/query-builder/VtsQueryBuilderButton.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import type { QueryBuilderSchema } from '@core/packages/query-builder/types'
import { useQueryBuilder } from '@core/packages/query-builder/use-query-builder'
import { useUiStore } from '@core/stores/ui.store'
import { onMounted, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { schema } = defineProps<{
  schema: QueryBuilderSchema
}>()

const filter = defineModel<string>({ required: true })

const localFilter = ref('')

onMounted(() => {
  localFilter.value = filter.value
})

const { t } = useI18n()

const uiStore = useUiStore()

const id = useId()

const { rootGroup, isUsable, updateFilter, resetFilter } = useQueryBuilder(filter, () => schema)

function handleSubmit() {
  filter.value = localFilter.value
}

watch(filter, newFilter => {
  localFilter.value = newFilter
})
</script>

<style lang="postcss" scoped>
.vts-query-builder {
  display: flex;
  align-items: center;
  gap: 1.6rem;

  @media (--small-or-medium) {
    gap: 1rem;

    .label {
      display: none;
    }
  }

  .input-container {
    flex: 1;
    min-width: 0;
  }
}
</style>
