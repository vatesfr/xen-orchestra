<template>
  <UiAlert v-if="isInfoVisible" accent="info" close @close="hideInfo">
    <span class="typo-body-bold">{{ t('role:what-is-a-role?') }}</span>
    <template #description>
      <span class="typo-body-regular">{{ t('role:what-is-a-role-description') }}</span>
    </template>
  </UiAlert>
</template>

<script lang="ts" setup>
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { useHidePermanently } from '@core/packages/hide-permanently/use-hide-permanently.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const [isInfoVisible, hideInfo] = useHidePermanently('what-is-a-role')
</script>
