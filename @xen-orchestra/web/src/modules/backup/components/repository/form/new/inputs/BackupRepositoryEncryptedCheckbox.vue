<template>
  <div class="backup-repository-encrypted-checkbox">
    <UiCheckbox v-model="model" accent="brand">
      {{ t('encrypted') }}
    </UiCheckbox>
    <UiInfo accent="warning" wrap>
      {{ t('encryption-key-loss-warning') }}
    </UiInfo>
  </div>
</template>

<script lang="ts" setup>
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { useI18n } from 'vue-i18n'

const model = defineModel<boolean>({ required: true })

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.backup-repository-encrypted-checkbox {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
