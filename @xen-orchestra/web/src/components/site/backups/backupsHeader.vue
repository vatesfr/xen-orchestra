<template>
  <UiHeadBar icon="fa:satellite" class="backups-header">
    <span class="backups-header-path">
      <UiLink to="/" size="medium">
        {{ t('site-name') }}
      </UiLink>
      <VtsIcon name="fa:angle-right" size="medium" />
      <UiLink to="/backups" size="medium">
        {{ t('backups') }}
      </UiLink>
      <VtsIcon name="fa:angle-right" size="medium" />
      <VtsIcon name="object:backup-job" size="medium" />
      {{ backupName }}
    </span>
  </UiHeadBar>
  <UiHeadBar icon="object:backup-job" class="backups-header">
    {{ backupName }}
    <template #actions>
      <UiLink size="medium" href="/#/backup/config">{{ t('configure-in-xo-5') }}</UiLink>
    </template>
  </UiHeadBar>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useI18n } from 'vue-i18n'

const { backupName } = defineProps<{
  backupName: string
}>()
const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.backups-header {
  font-size: 1.6rem;

  .backups-header-path {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
