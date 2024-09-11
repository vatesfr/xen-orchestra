<template>
  <MenuList border :disabled placement="bottom-end">
    <template #trigger="{ isOpen, open }">
      <AccountMenuTrigger :active="isOpen" @click="open($event)" />
    </template>
    <MenuItem :icon="faBook">
      <a
        class="link typo p2-medium"
        href="https://docs.xcp-ng.org?utm_campaign=xo6&utm_term=xcpdoc"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ $t('documentation-name', { name: 'XCP-ng' }) }}
      </a>
    </MenuItem>
    <MenuItem :icon="faHeadset">
      <a
        class="link typo p2-medium"
        href="https://vates.tech/pricing-and-support?utm_campaign=xo6&utm_term=pricing"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ $t('support-name', { name: 'XCP-ng' }) }}
      </a>
    </MenuItem>
    <MenuItem :icon="faArrowRightFromBracket" class="logout" @click="logout()">
      {{ $t('log-out') }}
    </MenuItem>
  </MenuList>
</template>

<script lang="ts" setup>
import AccountMenuTrigger from '@/components/account-menu/AccountMenuTrigger.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import { faArrowRightFromBracket, faBook, faHeadset } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  disabled?: boolean
}>()

// TODO: Fetch the XO 5 mount path from API when available
const logout = () => window.location.assign('/signout')
</script>

<style lang="postcss" scoped>
.link {
  text-decoration: none;
  color: var(--color-neutral-txt-primary);
  /* Make the link take the height of the MenuItem component */
  padding-block: 1.15rem;
  /* Make the link take the available width in the MenuItem component */
  flex-grow: 1;
}

.logout {
  color: var(--color-danger-txt-base);
}
</style>
