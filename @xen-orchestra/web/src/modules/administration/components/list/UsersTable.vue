<template>
  <div class="users-user-management-table">
    <UiTitle>
      {{ t('users') }}
      <template #action>
        <slot name="title-actions" />
      </template>
    </UiTitle>
    <div class="container">
      <!--          <div class="table-actions"> -->
      <!--            <UiQuerySearchBar @search="(value: string) => (searchQuery = value)" /> -->
      <!--          </div> -->

      <VtsTable :pagination-bindings sticky="right">
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="user of paginatedUsers" :key="user.id">
            <BodyCells :item="user" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useUserColumns } from '@core/tables/column-sets/user-columns.ts'
import { useI18n } from 'vue-i18n'

const { users } = defineProps<{
  users: FrontXoUser[]
}>()

defineSlots<{
  'title-actions'(): any
}>()

const { t } = useI18n()

const { pageRecords: paginatedUsers, paginationBindings } = usePagination('users', users)

const { HeadCells, BodyCells } = useUserColumns({
  body: (user: FrontXoUser) => {
    // const vbds = useGetVbdsByIds(vdi.$VBDs)
    //
    // const vbd = computed(() => vbds.value.find(vbd => vbd.VM === vm.id))
    //
    // const size = computed(() => formatSizeRaw(vdi.size, 2))
    // const format = computed(() => getVdiFormat(vdi.image_format))

    // const {
    //   openModal: openVbdConnectionToggleModal,
    //   canRun: canToggleVbdConnection,
    //   isRunning: isTogglingVbdConnection,
    //   errorMessage: toggleVbdConnectionErrorMessage,
    // } = useVbdConnectionToggleModal(
    //   () => (vbd.value?.attached ? CONNECTION_ACTION.DISCONNECT : CONNECTION_ACTION.CONNECT),
    //   () => (vbd.value ? [vbd.value] : []),
    //   () => vm
    // )
    //
    // const {
    //   openModal: openVbdDeleteModal,
    //   canRun: canDeleteVbd,
    //   isRunning: isDeletingVbd,
    //   errorMessage: deleteVbdErrorMessage,
    // } = useVbdDeleteModal(
    //   () => (vbd.value ? [vbd.value] : []),
    //   () => vm
    // )
    //
    // const {
    //   openModal: openVdiDeleteModal,
    //   canRun: canDeleteVdi,
    //   isRunning: isDeletingVdi,
    //   errorMessage: deleteVdiErrorMessage,
    // } = useVdiDeleteModal(
    //   () => [vdi],
    //   () => vm
    // )

    return {
      username: r =>
        r({
          label: user.email,
          to: { name: '/', params: {}, query: {} },
          icon: 'object:organization',
        }),
      firstname: r => r(user.name ?? ''),
      lastname: r => r(user.name ?? ''),
      email: r => r(user.email),
      provider: r => r(user.email),
      // actions: r =>
      //   r({
      //     onClick: () => (selectedVdiId.value = vdi.id),
      //     actions: [
      //       {
      //         label: vbd.value?.attached ? t('action:disconnect') : t('action:connect'),
      //         hint: !canToggleVbdConnection.value ? toggleVbdConnectionErrorMessage.value : undefined,
      //         icon: vbd.value?.attached ? 'action:disconnect' : 'action:connect',
      //         onClick: () => openVbdConnectionToggleModal(),
      //         disabled: !canToggleVbdConnection.value,
      //         busy: isTogglingVbdConnection.value,
      //       },
      //       {
      //         label: t('action:detach-vdi'),
      //         hint: deleteVbdErrorMessage.value,
      //         icon: 'action:detach',
      //         onClick: () => openVbdDeleteModal(),
      //         disabled: !canDeleteVbd.value,
      //         busy: isDeletingVbd.value,
      //       },
      //       {
      //         label: t('action:delete'),
      //         hint: deleteVdiErrorMessage.value,
      //         icon: 'action:delete',
      //         onClick: () => openVdiDeleteModal(),
      //         disabled: !canDeleteVdi.value,
      //         busy: isDeletingVdi.value,
      //       },
      //     ],
      //   }),
    }
  },
})
</script>

<style scoped lang="postcss">
.users-user-management-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.users-user-management-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }
}
</style>
