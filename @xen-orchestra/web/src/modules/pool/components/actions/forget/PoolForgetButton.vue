<template>
  <MenuItem
    v-tooltip="!canForgetServer && forgetServerErrorMessage"
    accent="brand"
    icon="action:forget"
    :disabled="!canForgetServer"
    :busy="isForgettingServer"
    class="forget"
    @click="forgetServer()"
  >
    {{ t('action:forget') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useServerForget } from '@/modules/server/composables/use-server-forget.composable.ts'
import { type FrontXoServer } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { server } = defineProps<{ server: FrontXoServer }>()

const { t } = useI18n()

const { forgetServer, canForgetServer, isForgettingServer, forgetServerErrorMessage } = useServerForget(
  () => server.id,
  () => server.label
)
</script>

<style lang="postcss" scoped>
.forget {
  color: var(--color-danger-item-base);
}
</style>
