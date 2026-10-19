<template>
  <li class="v2v-remembered-connection-item">
    <VtsIcon :name="icon" size="large" class="source-icon" />
    <div class="details">
      <div class="title typo-body-bold">
        {{ connection.host }}
        <UiTag accent="neutral" variant="secondary">{{ t('vmware') }}</UiTag>
      </div>
      <div class="description typo-body-regular-small">
        <span v-if="connection.product" class="part">{{ connection.product }} {{ connection.version }}</span>
        <span class="part">{{ connection.username }}</span>
        <I18nT
          v-if="connection.lastUsedAt !== undefined"
          keypath="used-relative-time"
          tag="span"
          class="part"
          scope="global"
        >
          <template #time>
            <VtsRelativeTime :date="connection.lastUsedAt" />
          </template>
        </I18nT>
        <span v-if="connection.skipSslCheck" class="part">{{ t('ssl-check-skipped') }}</span>
      </div>
      <div v-if="stats !== undefined" class="stats typo-body-regular-small">
        <span v-if="connection.vmCount !== undefined" class="part">{{ t('n-vms', { n: connection.vmCount }) }}</span>
        <span class="part">{{ t('n-migrated', { n: stats.cold }) }}</span>
        <span class="part">{{ t('n-partially-migrated', { n: stats.warm }) }}</span>
      </div>
    </div>
    <UiButton accent="brand" variant="primary" size="medium" :disabled @click="emit('connect', connection)">
      {{ t('action:connect') }}
    </UiButton>
    <MenuList placement="bottom-end">
      <template #trigger="{ open }">
        <UiButtonIcon
          v-tooltip="t('more-actions')"
          icon="action:more-actions"
          accent="brand"
          size="medium"
          :aria-label="t('more-actions')"
          @click="open($event)"
        />
      </template>
      <MenuItem icon="action:edit" accent="neutral" :on-click="() => emit('edit', connection)">
        {{ t('action:edit') }}
      </MenuItem>
      <MenuItem
        v-if="connection.password !== undefined"
        icon="action:forget"
        accent="neutral"
        :on-click="() => emit('forgetPassword', connection)"
      >
        {{ t('action:forget-password') }}
      </MenuItem>
      <MenuItem icon="action:delete" accent="danger" :on-click="() => emit('forget', connection)">
        {{ t('action:forget') }}
      </MenuItem>
    </MenuList>
  </li>
</template>

<script lang="ts" setup>
import { useV2vSourceStats } from '@/modules/v2v/composables/use-v2v-source-stats.composable.ts'
import type { V2vRememberedConnection } from '@/modules/v2v/types/v2v-remembered-connection.type.ts'
import { getV2vSourceKind } from '@/modules/v2v/utils/v2v-source.util.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { I18nT, useI18n } from 'vue-i18n'

const { connection } = defineProps<{
  connection: V2vRememberedConnection
  disabled?: boolean
}>()

const emit = defineEmits<{
  connect: [connection: V2vRememberedConnection]
  edit: [connection: V2vRememberedConnection]
  forget: [connection: V2vRememberedConnection]
  forgetPassword: [connection: V2vRememberedConnection]
}>()

const { t } = useI18n()

const stats = useV2vSourceStats(() => connection.sourceId)

const icon = computed(() => (getV2vSourceKind(connection.product) === 'vcenter' ? 'fa:building' : 'fa:server'))
</script>

<style lang="postcss" scoped>
.v2v-remembered-connection-item {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 1.4rem;
  border: 0.1rem solid var(--color-neutral-border);
  border-radius: 0.8rem;
  list-style: none;

  .source-icon {
    color: var(--color-brand-item-base);
  }

  .details {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }

  .title {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .description {
    color: var(--color-neutral-txt-secondary);
  }

  .stats {
    color: var(--color-success-txt-base);
  }

  .part:not(:first-child)::before {
    content: '•' / '';
    margin-inline: 0.8rem;
  }
}
</style>
