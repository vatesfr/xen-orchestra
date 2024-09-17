<template>
  <div>
    <img alt="" src="../assets/page-not-found.svg" />
    <p class="numeric">404</p>
    <p class="text">{{ $t('page-not-found') }}</p>
    <UiButton @click="router.push({ name: 'home' })">{{ $t('back-pool-dashboard') }}</UiButton>
  </div>
</template>

<script setup lang="ts">
import { usePageTitleStore } from '@/stores/page-title.store'
import UiButton from '@core/components/button/UiButton.vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const router = useRouter()
usePageTitleStore().setTitle(useI18n().t('not-found'))
</script>

<style lang="postcss" scoped>
div {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
img {
  width: 30%;
}
.numeric {
  color: var(--color-normal-txt-base);
  font-size: 96px;
  font-weight: 900;
  letter-spacing: 1em;
  line-height: 100%;
  margin-right: -1em;
  text-align: center;
}

.text {
  color: var(--color-normal-txt-base);
  font-size: 36px;
  font-weight: 400;
  line-height: 150%;
  margin: 0.5em;
  text-align: center;
}
</style>
