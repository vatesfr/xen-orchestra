<template>
  <MenuItem
    v-tooltip="!canAddNewHost && addNewHostErrorMessage"
    accent="neutral"
    icon="action:add"
    class="typo-body-bold-small"
    :disabled="!canAddNewHost"
    :busy="isAddingNewHost"
    @click="addNewHost()"
  >
    {{ t('new-host') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { usePoolNewHost } from '@/modules/pool/composables/use-pool-new-host.composable.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { poolId } = defineProps<{ poolId: FrontXoPool['id'] }>()

const { t } = useI18n()

const { addNewHost, isAddingNewHost, canAddNewHost, addNewHostErrorMessage } = usePoolNewHost(() => poolId)
</script>
