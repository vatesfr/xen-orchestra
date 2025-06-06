<template>
  <div class="vts-loading-hero">
    <VtsStateHero :type busy>
      {{ t('loading-in-progress') }}
    </VtsStateHero>
    <div v-if="slots.title || slots.text" class="content">
      <div v-if="slots.title" class="title" :class="className">
        <slot name="title" />
      </div>
      <div v-if="slots.text" class="text typo-body-bold">
        <slot name="text" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import VtsStateHero, { type StateHeroType } from '@core/components/state-hero/VtsStateHero.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { type } = defineProps<{
  type: StateHeroType
}>()

const slots = defineSlots<{
  title?(): any
  text?(): any
}>()

const { t } = useI18n()

const className = computed(() => (type === 'page' ? 'typo-h1' : 'typo-h2'))
</script>

<style lang="postcss" scoped>
.vts-loading-hero {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
    text-align: center;

    .title {
      color: var(--color-neutral-txt-primary);
    }

    .text {
      color: var(--color-neutral-txt-secondary);
    }
  }
}
</style>
