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
    <MenuItem class="icon" icon="fa:circle-user">
      <a class="link typo-body-bold-small" href="/#/user" rel="noopener noreferrer" target="_blank">
        {{ t('account') }}
        <VtsIcon size="small" name="fa:arrow-up-right-from-square" />
      </a>
    </MenuItem>

    <MenuItem class="icon" icon="fa:satellite">
      <a class="link typo-body-bold-small" href="/#/xoa/licenses" rel="noopener noreferrer" target="_blank">
        {{ t('license-name', { name: 'XOA' }) }}
        <VtsIcon size="small" name="fa:arrow-up-right-from-square" />
      </a>
    </MenuItem>

    <MenuItem class="icon" icon="fa:book">
      <a
        class="link typo-body-bold-small"
        href="https://docs.xen-orchestra.com"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ t('documentation-name', { name: 'XO' }) }}
        <VtsIcon size="small" name="fa:arrow-up-right-from-square" />
      </a>
    </MenuItem>

    <MenuItem class="icon" icon="fa:book">
      <a
        class="link typo-body-bold-small"
        href="https://docs.xcp-ng.org?utm_campaign=xo6&utm_term=xcpdoc"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ t('documentation-name', { name: 'XCP-ng' }) }}
        <VtsIcon size="small" name="fa:arrow-up-right-from-square" />
      </a>
    </MenuItem>

    <MenuItem class="icon" icon="fa:headset">
      <a
        class="link typo-body-bold-small"
        href="https://vates.tech/pricing-and-support?utm_campaign=xo6&utm_term=pricing"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ t('professional-support') }}
        <VtsIcon size="small" name="fa:arrow-up-right-from-square" />
      </a>
    </MenuItem>

    <MenuItem class="icon" icon="fa:code">
      <a class="link typo-body-bold-small" href="/rest/v0/docs/#/" rel="noopener noreferrer" target="_blank">
        {{ t('documentation-name', { name: 'REST API' }) }}
        <VtsIcon size="small" name="fa:arrow-up-right-from-square" />
      </a>
    </MenuItem>

    <MenuItem class="icon" icon="fa:message">
      <a
        class="link typo-body-bold-small"
        href="https://xcp-ng.org/forum/category/12/xen-orchestra"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ t('send-us-feedback') }}
        <VtsIcon size="small" name="fa:arrow-up-right-from-square" />
      </a>
    </MenuItem>

    <MenuItem class="icon" icon="fa:arrow-right-from-bracket" @click="logout()">
      <span class="link typo-body-bold-small">{{ t('log-out') }}</span>
    </MenuItem>
  </MenuList>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
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
  color: var(--color-brand-txt-base);
  /* Make the link take the height of the MenuItem component */
  padding-block: 1.15rem;
  /* Make the link take the available width in the MenuItem component */
  flex-grow: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
}

.icon {
  color: var(--color-brand-txt-base);

  &:hover {
    color: var(--color-brand-txt-hover);
  }
  &:active {
    color: var(--color-brand-txt-active);
  }
}
</style>
