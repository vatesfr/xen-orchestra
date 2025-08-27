<template>
  <VtsStateHero image-size="medium" horizontal format="card" type="all-good">
    {{ t('all-done') }}
  </VtsStateHero>
  <VtsDivider type="stretch" />
  <VtsStateHero image-size="small" horizontal format="card" type="all-good">
    {{ t('all-done') }}
  </VtsStateHero>
  <VtsDivider type="stretch" />
  <VtsStateHero image-size="large" format="page" type="all-good">
    {{ t('all-done') }}
  </VtsStateHero>
  <VtsDivider type="stretch" />
  Free
  <VtsStateHero format="card" busy>{{ t('loading') }}</VtsStateHero>
  <VtsStateHero format="page" busy>{{ t('loading') }}</VtsStateHero>
  <VtsStateHero format="table" busy>{{ t('loading') }}</VtsStateHero>
  <VtsStateHero format="panel" busy>{{ t('loading') }}</VtsStateHero>
  <VtsDivider type="stretch" />
  <VtsStateHero image-size="small" format="card" type="error">
    {{ t('error-no-data') }}
  </VtsStateHero>
  <VtsDivider type="stretch" />
  <VtsStateHero image-size="large" horizontal format="card" type="no-data">
    {{ t('no-data') }}
  </VtsStateHero>
</template>

<script setup lang="ts">
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
