<template>
  <div class="vts-query-builder" role="search">
    <label :for="id" class="typo-body-regular-small label">
      {{ t('query-builder:label') }}
    </label>
    <div class="input-container">
      <UiInput
        :id
        v-model="localFilter"
        :accent="isUsable ? 'brand' : 'danger'"
        :aria-label="uiStore.isSmall ? t('query-builder:label') : undefined"
        :placeholder="t('query-builder:placeholder')"
        enterkeyhint="search"
        clearable
        @clear="search()"
        @keydown.enter="handleEnterKey($event)"
      />
    </div>

    <UiButtonIcon
      v-if="uiStore.isSmallOrMedium"
      icon="fa:magnifying-glass"
      size="medium"
      accent="brand"
      @click="search()"
    />
    <template v-else>
      <UiButton size="medium" accent="brand" variant="secondary" @click="search()">
        {{ t('action:search') }}
      </UiButton>

      <VtsDivider type="stretch" />
    </template>

    <VtsQueryBuilderButton
      v-model="rootGroup"
      :small="uiStore.isSmallOrMedium"
      :disabled="!isUsable"
      @confirm="updateFilter()"
      @cancel="resetFilter()"
    />
  </div>
</template>

<script setup lang="ts">
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsQueryBuilderButton from '@core/components/query-builder/VtsQueryBuilderButton.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { useQueryBuilder } from '@core/packages/query-builder/use-query-builder.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { syncRef } from '@vueuse/core'
import { ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'

const { schema } = defineProps<{
  schema: QueryBuilderSchema
}>()

const filter = defineModel<string>({ required: true })

const localFilter = ref('')

syncRef(filter, localFilter, { direction: 'ltr' })

const { t } = useI18n()

const uiStore = useUiStore()

const id = useId()

const { rootGroup, isUsable, updateFilter, resetFilter } = useQueryBuilder(filter, () => schema)

function search() {
  filter.value = localFilter.value
}

function handleEnterKey(event: KeyboardEvent) {
  // Ignore Enter when it confirms an IME composition
  if (event.isComposing || event.keyCode === 229) {
    return
  }

  event.preventDefault()
  search()
}
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
