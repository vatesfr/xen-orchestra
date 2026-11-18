<template>
  <UiCard class="account-avatar-card">
    <UiTitle>{{ t('avatar') }}</UiTitle>
    <div class="avatar">
      <UiUserLogo size="medium" />
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiUserLogo from '@core/components/ui/user-logo/UiUserLogo.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.account-avatar-card {
  .avatar {
    display: flex;
    justify-content: center;
  }
}
</style>
