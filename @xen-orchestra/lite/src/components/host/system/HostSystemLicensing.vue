<template>
  <UiCard>
    <UiTitle>
      {{ $t('licensing') }}
    </UiTitle>
    <VtsCardRowKeyValue>
      <!--      <template #key> {{ $t('licence-type') }}</template> -->
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>
        <!--        {{ $t('licence-socket') }} -->
      </template>
      <template #value>
        <!--        Waiting for the API endpoint -->
      </template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>
        <!--        {{ $t('expiration-date') }} -->
      </template>
      <template #value>
        <!--        Waiting for the API endpoint -->
      </template>
    </VtsCardRowKeyValue>
  </UiCard>
</template>

<script setup lang="ts">
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
</script>
