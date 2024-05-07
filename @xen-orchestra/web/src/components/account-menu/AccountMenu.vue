<template>
  <MenuList :disabled placement="bottom-end">
    <template #trigger="{ isOpen, open }">
      <AccountMenuTrigger :active="isOpen" @click="open" />
    </template>
    <MenuItem :icon="faArrowRightFromBracket" :on-click="logout" class="logout">
      {{ $t('core.log-out') }}
    </MenuItem>
  </MenuList>
</template>

<script lang="ts" setup>
import AccountMenuTrigger from '@/components/account-menu/AccountMenuTrigger.vue'
import { useAuth } from '@/composables/auth.composable'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import { faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  disabled?: boolean
}>()

const { logout } = useAuth()
</script>

<style lang="postcss" scoped>
.logout {
  color: var(--color-red-base);
}
</style>
