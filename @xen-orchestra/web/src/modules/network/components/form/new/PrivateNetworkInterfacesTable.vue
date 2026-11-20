<template>
  <div class="private-network-interfaces-table">
    <VtsTable>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow
          v-for="(networkInterface, index) of interfaces"
          :key="networkInterface.key"
          :error="showErrors && erroredInterfaceKeys.has(networkInterface.key)"
        >
          <BodyCells :item="{ networkInterface, onRemove: index > 0 ? () => emit('remove', index) : undefined }" />
        </VtsRow>
        <tr>
          <UiTableCell :colspan>
            <UiButton
              :disabled="!canAdd"
              accent="brand"
              left-icon="fa:plus"
              size="medium"
              variant="tertiary"
              @click="emit('add')"
            >
              {{ t('new') }}
            </UiButton>
          </UiTableCell>
        </tr>
      </tbody>
    </VtsTable>
    <UiInfo v-if="!canAdd" accent="info" wrap>{{ t('new-network:all-pools-selected') }}</UiInfo>
    <VtsErrorList v-if="showErrors && errors.length > 0">
      <li v-for="error of errors" :key="error.key" class="error">
        {{ t('new-network:interface-number:', { n: error.number }) }}
        <ul class="messages">
          <li v-for="message of error.messages" :key="message">{{ message }}</li>
        </ul>
      </li>
    </VtsErrorList>
  </div>
</template>

<script lang="ts" setup>
import type { PrivateNetworkInterfaceError } from '@/modules/network/form/new-private/use-new-private-network-form.ts'
import {
  type PrivateNetworkInterface,
  usePrivateNetworkInterface,
} from '@/modules/network/form/new-private/use-private-network-interface.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VtsErrorList from '@core/components/error-list/VtsErrorList.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { usePrivateNetworkInterfaceColumns } from '@core/tables/column-sets/private-network-interface-columns.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { errors, getExcludedPoolIds } = defineProps<{
  interfaces: PrivateNetworkInterface[]
  canAdd: boolean
  errors: PrivateNetworkInterfaceError[]
  showErrors: boolean
  getExcludedPoolIds: (key: PrivateNetworkInterface['key']) => FrontXoPool['id'][]
}>()

const emit = defineEmits<{
  add: []
  remove: [index: number]
}>()

const { t } = useI18n()

const erroredInterfaceKeys = computed(() => new Set(errors.map(error => error.key)))

const { HeadCells, BodyCells, colspan } = usePrivateNetworkInterfaceColumns({
  body: (item: { networkInterface: PrivateNetworkInterface; onRemove: (() => void) | undefined }) => {
    const { networkInterface } = item

    const { poolSelectId, pifSelectId } = usePrivateNetworkInterface(networkInterface, () =>
      getExcludedPoolIds(networkInterface.key)
    )

    return {
      pool: r => r(poolSelectId),
      pif: r => r(pifSelectId),
      remove: r => r(item.onRemove),
    }
  },
})
</script>

<style lang="postcss" scoped>
.private-network-interfaces-table {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .error {
    list-style: none;
    margin-inline-start: -1.6rem;
  }

  .messages {
    list-style: disc;
    padding-inline-start: 1.6rem;
  }
}
</style>
