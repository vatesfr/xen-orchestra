<template>
  <MenuItem
    v-tooltip="!canAddExistingHost && addExistingHostErrorMessage"
    accent="neutral"
    icon="action:attach"
    class="typo-body-bold-small"
    :disabled="!canAddExistingHost"
    :busy="isAddingExistingHost"
    @click="addExistingHost()"
  >
    {{ t('existing-host') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { usePoolExistingHost } from '@/modules/pool/composables/use-pool-existing-host.composable.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { poolId } = defineProps<{ poolId: FrontXoPool['id'] }>()

const { t } = useI18n()

const { addExistingHost, isAddingExistingHost, canAddExistingHost, addExistingHostErrorMessage } = usePoolExistingHost(
  () => poolId
)
</script>
