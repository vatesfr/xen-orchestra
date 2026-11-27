<template>
  <MenuItem v-if="isInMenu" accent="neutral" icon="action:add" class="typo-body-bold-small" @click="goToNewVm()">
    {{ t('new-vm') }}
  </MenuItem>
  <UiLink v-else class="link" size="medium" icon="action:add" :to="newVmRoute">
    {{ t('new-vm') }}
  </UiLink>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { IK_IN_MENU } from '@core/utils/injection-keys.util.ts'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { poolId } = defineProps<{ poolId: FrontXoPool['id'] }>()

const { t } = useI18n()
const router = useRouter()

const isInMenu = inject(IK_IN_MENU, false)

const newVmRoute = computed(() => ({ name: '/vm/new' as const, query: { poolid: poolId } }))

const goToNewVm = () => router.push(newVmRoute.value)
</script>

<style lang="postcss" scoped>
.link {
  padding-inline: 1.6rem;
}
</style>
