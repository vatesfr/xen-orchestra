<template>
  <MenuItem
    v-tooltip="!canForgetPifs && forgetPifsErrorMessage"
    accent="danger"
    icon="action:forget"
    :disabled="!canForgetPifs"
    :busy="isForgettingPifs"
    @click="forgetPifs()"
  >
    {{ t('action:forget') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { usePifForget } from '@/modules/pif/composables/use-pif-forget.composable.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { pif } = defineProps<{
  pif: FrontXoPif
}>()

const { t } = useI18n()

const { forgetPifs, canForgetPifs, isForgettingPifs, forgetPifsErrorMessage } = usePifForget(() => [pif])
</script>
