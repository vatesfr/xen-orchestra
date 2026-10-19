<template>
  <li class="v2v-remembered-connection-item">
    <VtsIcon :name="icon" size="large" class="source-icon" />
    <div class="details">
      <div class="title typo-body-bold">
        {{ connection.host }}
        <UiTag accent="neutral" variant="secondary">{{ t('vmware') }}</UiTag>
      </div>
      <InlineParts class="description typo-body-regular-small">
        <span v-if="connection.product">{{ connection.product }} {{ connection.version }}</span>
        <span>{{ connection.username }}</span>
        <I18nT v-if="connection.lastUsedAt !== undefined" keypath="used-relative-time" tag="span" scope="global">
          <template #time>
            <VtsRelativeTime :date="connection.lastUsedAt" />
          </template>
        </I18nT>
        <span v-if="connection.skipSslCheck">{{ t('ssl-check-skipped') }}</span>
      </InlineParts>
      <InlineParts v-if="progressLabels !== undefined" class="stats typo-body-regular-small">
        <span v-if="connection.vmCount !== undefined">{{ t('n-vms', { n: connection.vmCount }) }}</span>
        <span v-for="label of progressLabels" :key="label">{{ label }}</span>
      </InlineParts>
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
import { useV2vVmLabels } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import type { V2vRememberedConnection } from '@/modules/v2v/types/v2v-remembered-connection.type.ts'
import { getV2vSourceKind } from '@/modules/v2v/utils/v2v-source.util.ts'
import InlineParts from '@/shared/components/InlineParts.vue'
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

const { getStatusCountLabel } = useV2vVmLabels()

// The imports of the source, most advanced first
const progressLabels = computed(() => {
  const counts = stats.value

  if (counts === undefined) {
    return undefined
  }

  return [getStatusCountLabel('cold', counts.cold), getStatusCountLabel('warm', counts.warm)]
})

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
}
</style>
