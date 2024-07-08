<template>
  <div class="s3-backup-repository">
    <CardTitle>
      <!-- {{ $t('s3-backup-repository') }} -->
      <!-- <template #description>{{ $t('for-backup') }}</template> -->
    </CardTitle>

    <CardNumbers :value="41.5" unit="G.B" label="Used for backup" size="medium" />
  </div>
</template>

<script setup lang="ts">
import CardTitle from '@core/components/card/CardTitle.vue'
import CardNumbers from '@core/components/CardNumbers.vue'
</script>

<style scoped lang="scss">
.s3-backup-repository {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
  width: 100%;
}
</style>
