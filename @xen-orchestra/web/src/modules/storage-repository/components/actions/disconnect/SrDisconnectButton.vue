<template>
  <MenuItem icon="action:disconnect" :disabled="!canDisconnectSr" :busy="isDisconnectingSr" @click="disconnectSr()">
    {{ t('action:disconnect') }}
    <UiCounter
      v-if="shouldShowTargetCount(scope, disconnectTargetCount)"
      :value="disconnectTargetCount"
      accent="brand"
      variant="secondary"
      size="small"
    />
    <i v-if="hint">{{ hint }}</i>
  </MenuItem>
</template>

<script lang="ts" setup>
import { useSrConnection } from '@/modules/storage-repository/composables/use-sr-connection.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { type SrScope } from '@core/types/storage-repository.type.ts'
import { shouldShowTargetCount } from '@core/utils/sr.utils.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { sr, scope } = defineProps<{
  sr: FrontXoSr
  scope: SrScope
}>()

const { t } = useI18n()

const { disconnectSr, canDisconnectSr, isDisconnectingSr, disconnectSrErrorMessage, disconnectTargetCount } =
  useSrConnection({
    srs: () => [sr],
    scope: () => scope,
  })

const hint = computed(() => (!canDisconnectSr.value ? disconnectSrErrorMessage.value : undefined))
</script>
