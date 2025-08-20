<!-- v5 -->
<template>
  <div class="ui-table-pagination" :class="className">
    <div class="container">
      <span class="typo-body-regular-small label">
        {{ t('core.select.n-object-of', { from, to, total }) }}
      </span>
      <div class="buttons-container">
        <PaginationButton :disabled="isFirstPage" :icon="faAngleDoubleLeft" @click="emit('first')" />
        <PaginationButton :disabled="isFirstPage" :icon="faAngleLeft" @click="emit('previous')" />
        <PaginationButton :disabled="isLastPage" :icon="faAngleRight" @click="emit('next')" />
        <PaginationButton :disabled="isLastPage" :icon="faAngleDoubleRight" @click="emit('last')" />
      </div>
    </div>
    <div class="container">
      <span class="typo-body-regular-small label show">{{ t('core.pagination.show-by') }}</span>
      <VtsSelect :id="showBySelectId" accent="brand" class="typo-body-regular-small show-by-select" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import VtsSelect from '@core/components/select/VtsSelect.vue'
import PaginationButton from '@core/components/ui/table-pagination/PaginationButton.vue'
import { useFormSelect } from '@core/packages/form-select'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { faAngleDoubleLeft, faAngleDoubleRight, faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { size } = defineProps<{
  from: number
  to: number
  total: number
  isFirstPage: boolean
  isLastPage: boolean
  size: 'small' | 'medium'
}>()

const emit = defineEmits<{
  first: []
  previous: []
  next: []
  last: []
}>()

const showBy = defineModel<number>('showBy', { default: 24 })

const className = computed(() => toVariants({ size }))

const { t } = useI18n()

const { id: showBySelectId } = useFormSelect([12, 24, 48, -1], {
  model: showBy,
  option: {
    label: option => (option === -1 ? t('core.pagination.all') : option.toString()),
  },
})
</script>

<style lang="postcss" scoped>
.ui-table-pagination {
  display: flex;
  align-items: center;
  gap: 0.8rem;

  &.size--small {
    flex-direction: column;
    align-items: flex-end;
  }

  &.size--medium {
    flex-direction: row;
  }

  .container {
    display: flex;
    gap: 0.8rem;
    align-items: center;
  }

  .buttons-container {
    display: flex;
    gap: 0.2rem;
  }

  .label {
    color: var(--color-neutral-txt-secondary);
  }

  /* Workaround: we don't have "small" select yet */
  .show-by-select {
    width: 6rem;

    &:deep(.ui-input) {
      height: 3rem;
      padding-inline: 0.8rem;
      gap: 0.8rem;
      min-width: 6rem;
    }

    &:deep(.input) {
      font-size: 1.4rem;
    }
  }
}
</style>
