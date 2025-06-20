<template>
  <MenuList :disabled placement="bottom-end">
    <template #trigger="{ isOpen, open }">
      <UiAccountMenuButton
        v-tooltip="isOpen ? false : { content: t('account-organization-more'), placement: 'bottom-end' }"
        :selected="isOpen"
        size="medium"
        @click="open($event)"
      />
    </template>
    <MenuItem icon="fa:book">
      <a
        class="link typo-body-bold-small"
        href="https://docs.xcp-ng.org?utm_campaign=xo6&utm_term=xcpdoc"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ t('documentation-name', { name: 'XCP-ng' }) }}
      </a>
    </MenuItem>
    <MenuItem icon="fa:headset">
      <a
        class="link typo-body-bold-small"
        href="https://vates.tech/pricing-and-support?utm_campaign=xo6&utm_term=pricing"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ t('professional-support') }}
      </a>
    </MenuItem>
    <MenuItem icon="fa:code">
      <a class="link typo-body-bold-small" href="/rest/v0/docs/#/" rel="noopener noreferrer" target="_blank">
        {{ t('documentation-name', { name: 'REST API' }) }}
      </a>
    </MenuItem>
    <MenuItem icon="fa:arrow-right-from-bracket" class="logout" @click="logout()">
      {{ t('log-out') }}
    </MenuItem>
  </MenuList>
</template>

<script lang="ts" setup>
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiAccountMenuButton from '@core/components/ui/account-menu-button/UiAccountMenuButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useI18n } from 'vue-i18n'

defineProps<{
  disabled?: boolean
}>()

const { t } = useI18n()

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
