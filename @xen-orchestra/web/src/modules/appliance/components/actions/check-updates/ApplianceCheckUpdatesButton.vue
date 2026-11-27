<template>
  <VtsActionButton
    :busy="isCheckingUpdates"
    :disabled="upgrade !== undefined"
    :hint="hint"
    accent="brand"
    icon="action:scan"
    variant="tertiary"
    @click="checkUpdates()"
  >
    {{ t('action:check-for-updates') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { useXoaUpgrade } from '@/modules/appliance/composables/use-xoa-upgrade.composable.ts'
import { useXoaPackages } from '@/modules/appliance/remote-resources/use-xoa-packages.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// comme « Refresh » en XO 5 : `GET plugins/xoa/packages` lance une vérification chez xoa-updater
const { checkUpdates, isCheckingUpdates } = useXoaPackages()

const { upgrade } = useXoaUpgrade()

const hint = computed(() => {
  if (upgrade.value === undefined) {
    return undefined
  }

  return t('job:xoa-upgrade:in-progress')
})
</script>
