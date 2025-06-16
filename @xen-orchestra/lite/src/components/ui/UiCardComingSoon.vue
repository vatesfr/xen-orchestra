<template>
  <UiCard class="ui-card-coming-soon">
    <UiCardTitle>{{ title }}</UiCardTitle>
    <div class="content">
      <img alt="" src="@/assets/under-construction.svg" />
    </div>
    <div class="content">{{ t('coming-soon') }}</div>
  </UiCard>
</template>

<script setup lang="ts">
import UiCard from '@/components/ui/UiCard.vue'
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  title: string
}>()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.ui-card-coming-soon {
  display: flex;
  flex-direction: column;
}

.content {
  padding: 1rem 0;
  text-align: center;
}
</style>
