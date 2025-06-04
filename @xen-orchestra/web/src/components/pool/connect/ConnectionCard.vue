<template>
  <UiCard>
    <form class="pool-connection-card">
      <div class="input-warpper">
        <UiTitle class="primary-host-title">{{ $t('primary-host') }}</UiTitle>
        <div class="input-content">
          <VtsInputWrapper :label="$t('ip-address')">
            <UiInput v-model="ip" accent="brand" required />
            <UiInfo accent="info" wrap>
              {{ $t('pool-connection-ip-info') }}
            </UiInfo>
          </VtsInputWrapper>
          <VtsInputWrapper :label="$t('proxy-url')"> <UiInput v-model="proxy" accent="brand" /> </VtsInputWrapper>
          <VtsInputWrapper :label="$t('username')">
            <UiInput v-model="username" accent="brand" required />
            <UiInfo accent="info" wrap>
              {{ $t('root-by-default') }}
            </UiInfo>
          </VtsInputWrapper>
          <VtsInputWrapper :label="$t('password')">
            <UiInput v-model="password" accent="brand" required />
          </VtsInputWrapper>
        </div>
      </div>
      <UiTitle>{{ $t('option') }}</UiTitle>
      <div class="checkbox-wrapper">
        <UiCheckbox v-model="readOnly" accent="brand">{{ $t('read-only') }}</UiCheckbox>
        <UiCheckbox v-model="selfSigned" accent="brand">{{ $t('accept-self-signed-certificates') }}</UiCheckbox>
      </div>
      <div class="button-warper">
        <UiButton accent="brand" size="medium" variant="secondary">{{ $t('cancel') }}</UiButton>
        <UiButton type="submit" accent="brand" size="medium" variant="primary">{{ $t('connect') }}</UiButton>
      </div>
    </form>
  </UiCard>
</template>

<script setup lang="ts">
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { ref } from 'vue'
const ip = ref()
const proxy = ref()
const username = ref()
const password = ref()
const readOnly = ref(false)
const selfSigned = ref(false)
</script>

<style lang="postcss" scoped>
.pool-connection-card {
  margin: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 4rem;
  .input-content {
    display: grid;
    grid-template-columns: 40rem 40rem;
    gap: 1.6rem 8rem;

    .primary-host-title {
      grid-column: 1 / 3;
    }
  }

  .input-warpper {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }

  .checkbox-wrapper {
    display: flex;
    gap: 8rem;
  }

  .button-warper {
    display: flex;
    width: 100%;
    justify-content: center;
    gap: 2.4rem;
  }
}
</style>
