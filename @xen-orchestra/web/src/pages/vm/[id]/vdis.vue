<template>
  <VtsContentSidePanel class="vdis">
    <UiCard class="container">
      <VdisTable :vdis="filteredVdisByNotCdVbd" :vm :busy="!areVmVdisReady" :error="hasVmVdiFetchError">
        <template #title-actions>
          <MenuList placement="bottom-end">
            <template #trigger="{ open }">
              <UiDropdownButton icon="action:add" @click="open($event)">{{ t('action:add') }}</UiDropdownButton>
            </template>
            <MenuItem>
              <UiLink
                class="add-vdi-link"
                :to="{ name: '/vdi/new', query: { vmid: vm.id } }"
                icon="fa:plus"
                size="medium"
              >
                {{ t('action:create-vdi') }}
              </UiLink>
            </MenuItem>
            <MenuItem>
              <UiLink
                class="add-vdi-link"
                :to="{ name: '/vdi/attach', query: { vmid: vm.id } }"
                icon="action:attach"
                size="medium"
              >
                {{ t('action:attach-vdi') }}
              </UiLink>
            </MenuItem>
          </MenuList>
        </template>
      </VdisTable>
    </UiCard>
    <VdiSidePanel :vdi="selectedVdi" :vm @close="selectedVdi = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import VdiSidePanel from '@/modules/vdi/components/list/panel/VdiSidePanel.vue'
import VdisTable from '@/modules/vdi/components/list/VdisTable.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoVmVbdsUtils } from '@/modules/vm/composables/xo-vm-vbd-utils.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoVmVdisCollection } from '@/modules/vm/remote-resources/use-xo-vm-vdis-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { vmVdis, getVmVdiById, hasVmVdiFetchError, areVmVdisReady } = useXoVmVdisCollection({}, () => vm.id)

const { notCdDriveVbds } = useXoVmVbdsUtils(() => vm)

const filteredVdisByNotCdVbd = computed(() =>
  vmVdis.value.filter(vdi => notCdDriveVbds.value.some(vbd => vdi.$VBDs.includes(vbd.id)))
)

const selectedVdi = useRouteQuery<FrontXoVdi | undefined>('id', {
  toData: id => getVmVdiById(id as FrontXoVdi['id']),
  toQuery: vdi => vdi?.id ?? '',
})
</script>

<style scoped lang="postcss">
.vdis {
  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}

/* This selector can't be nested,
* as the links in MenuItem are teleported and are not children of .vdis element.
* This selector extends the clickable area of the links for better accessibility
*/
.add-vdi-link {
  height: 100%;
  width: 100%;
}
</style>
