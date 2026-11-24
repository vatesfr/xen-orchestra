<template>
  <MenuItem v-if="isInMenu" accent="neutral" icon="action:add" class="typo-body-bold-small">
    {{ t('action:add-host') }}
    <template #submenu>
      <PoolAddNewHostButton :pool-id />
      <PoolAddExistingHostButton :pool-id />
    </template>
  </MenuItem>
  <VtsResponsiveMenu v-else :title="t('action:add-host')" placement="bottom-end">
    <template #trigger="{ open, bindings }">
      <UiDropdownButton v-bind="bindings" variant="secondary" size="medium" icon="action:add" @click="open($event)">
        {{ t('action:add-host') }}
      </UiDropdownButton>
    </template>
    <PoolAddNewHostButton :pool-id />
    <PoolAddExistingHostButton :pool-id />
  </VtsResponsiveMenu>
</template>

<script lang="ts" setup>
import PoolAddExistingHostButton from '@/modules/pool/components/actions/add-host/PoolAddExistingHostButton.vue'
import PoolAddNewHostButton from '@/modules/pool/components/actions/add-host/PoolAddNewHostButton.vue'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import VtsResponsiveMenu from '@core/components/menu/VtsResponsiveMenu.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import { IK_IN_MENU } from '@core/utils/injection-keys.util.ts'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{ poolId: FrontXoPool['id'] }>()

const { t } = useI18n()

const isInMenu = inject(IK_IN_MENU, false)
</script>
