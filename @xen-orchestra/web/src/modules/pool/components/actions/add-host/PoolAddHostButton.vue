<template>
  <VtsResponsiveMenu :title="t('action:add-host')" placement="bottom-end">
    <template #trigger="{ open, bindings }">
      <UiDropdownButton v-bind="bindings" variant="secondary" size="medium" icon="action:add" @click="open($event)">
        {{ t('action:add-host') }}
      </UiDropdownButton>
    </template>
    <MenuItem accent="neutral" icon="action:add" class="typo-body-bold-small" @click="addNewHost()">
      {{ t('new-host') }}
    </MenuItem>
    <MenuItem accent="neutral" icon="action:attach" class="typo-body-bold-small" @click="addExistingHost()">
      {{ t('existing-host') }}
    </MenuItem>
  </VtsResponsiveMenu>
</template>

<script lang="ts" setup>
import { usePoolExistingHost } from '@/modules/pool/composables/use-pool-existing-host.composable.ts'
import { usePoolNewHost } from '@/modules/pool/composables/use-pool-new-host.composable.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import VtsResponsiveMenu from '@core/components/menu/VtsResponsiveMenu.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import { useI18n } from 'vue-i18n'

const { poolId } = defineProps<{ poolId: FrontXoPool['id'] }>()

const { t } = useI18n()

const { addNewHost } = usePoolNewHost(() => poolId)
const { addExistingHost } = usePoolExistingHost(() => poolId)
</script>
