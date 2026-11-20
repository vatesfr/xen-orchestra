<template>
  <UiButton
    :busy="isCreatingTrafficRule"
    accent="brand"
    left-icon="fa:plus"
    size="medium"
    variant="tertiary"
    @click="openNewTrafficRuleDrawer()"
  >
    {{ t('new') }}
  </UiButton>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useNewTrafficRule } from '@/modules/traffic-rules/composables/use-new-traffic-rule.composable.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

const { poolId, vifId } = defineProps<{
  poolId: FrontXoPool['id']
  vifId?: FrontXoVif['id']
}>()

const { t } = useI18n()

const { openNewTrafficRuleDrawer, isCreatingTrafficRule } = useNewTrafficRule(
  () => poolId,
  () => vifId
)
</script>
