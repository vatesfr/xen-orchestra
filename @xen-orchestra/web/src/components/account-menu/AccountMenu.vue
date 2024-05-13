<template>
  <MenuList :disabled placement="bottom-end">
    <template #trigger="{ isOpen, open }">
      <AccountMenuTrigger :active="isOpen" @click="open($event)" />
    </template>
    <MenuItem :icon="faArrowRightFromBracket" class="logout" @click="logout()">
      {{ $t('core.log-out') }}
    </MenuItem>
  </MenuList>
</template>

<script lang="ts" setup>
import AccountMenuTrigger from '@/components/account-menu/AccountMenuTrigger.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import { faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  disabled?: boolean
}>()

// TODO: Fetch the XO 5 mount path from API when available
const logout = () => window.location.assign('/signout')
</script>

<style lang="postcss" scoped>
.logout {
  color: var(--color-red-base);
}
</style>
