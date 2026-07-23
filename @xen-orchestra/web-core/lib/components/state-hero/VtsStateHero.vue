<template>
  <div
    :class="[className, { horizontal: isHorizontal, error, success, 'no-background': noBackground }]"
    class="vts-state-hero"
  >
    <UiLoader v-if="type === 'busy'" class="loader" />
    <img v-else-if="imageSrc" :src="imageSrc" :alt="type" class="image" />
    <div v-if="slots.default || success" :class="[typoClass, { mobile: isMobile }]" class="content">
      <div v-if="success">{{ t('all-good!') }}</div>
      <slot />
    </div>
    <div v-else-if="type === 'no-selection'" :class="typoClass" class="content">
      <I18nT keypath="select-to-see-details" scope="global" tag="p">
        <template #icon>
          <VtsIcon name="fa:eye" size="current" />
        </template>
      </I18nT>
    </div>
  </div>
</template>

<script lang="ts" setup>
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import { useUiStore } from '@core/stores/ui.store'
import type { StateHeroFormat, StateHeroSize, StateHeroType } from '@core/types/state-hero.type.ts'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import VtsIcon from '../icon/VtsIcon.vue'

const { format, type, size, horizontal } = defineProps<{
  format: StateHeroFormat
  type: StateHeroType
  size: StateHeroSize
  horizontal?: boolean
  noBackground?: boolean
}>()

const slots = defineSlots<{
  default?(): any
}>()

const uiStore = useUiStore()

const { t } = useI18n()

const isHorizontal = computed(() => horizontal && !uiStore.isSmall)

const isMobile = computed(() => uiStore.isSmall)

const typoClass = computed(() => (format === 'page' ? 'typo-h2' : 'typo-h4'))

const className = computed(() => toVariants({ size, format }))

const error = computed(() => type === 'error')

const success = computed(() => type === 'all-good' || type === 'all-done')

const imageSrc = computed(() => {
  if (type === 'busy') {
    return undefined
  }

  return new URL(`../../assets/${type}.svg`, import.meta.url).href
})
</script>

<style lang="postcss" scoped>
.vts-state-hero {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2.4rem;

  &:not(.horizontal) {
    flex-direction: column;
  }

  .image {
    order: 2;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;

    &:not(.mobile) {
      text-align: center;
    }

    &:empty {
      display: none;
    }
  }

  .loader,
  .content {
    order: 3;
    color: var(--color-brand-txt-base);
  }

  &.success {
    .content {
      color: var(--color-success-txt-base);
    }
  }

  &.error {
    background-color: var(--color-danger-background-selected);

    &.no-background {
      background-color: transparent;
    }

    .content {
      color: var(--color-danger-txt-base);
    }
  }

  &.format--card {
    gap: 2rem;

    .content {
      order: 3;
    }

    .loader {
      order: 1;
    }

    .image {
      order: 2;
    }
  }

  &.format--table {
    padding: 2.4rem;
    gap: 2.4rem;

    .content {
      order: 3;
    }

    .loader {
      order: 1;
    }

    .image {
      order: 2;
    }
  }

  &.format--panel {
    gap: 4rem;
    justify-content: unset;
    padding-top: 8rem;

    .content {
      order: 1;
    }

    .loader {
      order: 3;
    }

    .image {
      order: 2;
    }
  }

  &.format--page {
    gap: 10rem;

    .content {
      order: 3;
    }

    .loader {
      order: 1;
    }

    .image {
      order: 2;
    }
  }

  &.size--extra-small {
    .loader {
      font-size: 1.6rem;
    }

    .image {
      max-height: 14rem;
    }
  }

  &.size--small {
    .loader {
      font-size: 2.4rem;
    }

    .image {
      max-height: 18rem;
    }
  }

  &.size--medium {
    .loader {
      font-size: 6.4rem;
    }

    .image {
      max-height: 30rem;
    }
  }

  &.size--large {
    .loader {
      font-size: 9.6rem;
    }
    .image {
      max-height: 50rem;
    }
  }
}
</style>
