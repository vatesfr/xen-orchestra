<template>
  <UiCard class="sr-vdis-view">
    <UiCardTitle subtitle>
      VDIs
    </UiCardTitle>
    <CollectionTable
      :collection="vdisOfSr"
    >
      <template #head-row>
        <ColumnHeader>{{ $t("name") }}</ColumnHeader>
        <ColumnHeader>{{ $t("description") }}</ColumnHeader>
        <ColumnHeader>{{ $t("size") }}</ColumnHeader>
        <ColumnHeader>{{ $t("vm") }}</ColumnHeader>
      </template>
      <template #body-row="{ item: vdi }">
        <td>
          <div class="vdi-name">
            {{ vdi.name_label }}
          </div>
        </td>
        <td>{{ vdi.name_description }}</td>
        <td>{{ formatSize(vdi.virtual_size) }}</td>
        <td>{{ getVms(vdi) }}</td>
      </template>
    </CollectionTable>
  </UiCard>
</template>

<script lang="ts" setup>
import CollectionTable from "@/components/CollectionTable.vue";
import ColumnHeader from "@/components/ColumnHeader.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import type { XenApiVbd, XenApiVdi, XenApiVm, XenApiSr } from "@/libs/xen-api/xen-api.types";
import { usePageTitleStore } from "@/stores/page-title.store";
import { useVdiCollection } from "@/stores/xen-api/vdi.store";
import { useSrCollection } from "@/stores/xen-api/sr.store";
import { useVbdCollection } from "@/stores/xen-api/vbd.store";
import { useVmCollection } from "@/stores/xen-api/vm.store";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { VDI_TYPE } from "@/libs/xen-api/xen-api.enums";
import { formatSize, percent } from "@/libs/utils";



const { t } = useI18n();
const route = useRoute();

usePageTitleStore().setTitle(useI18n().t("vdis"));

const {
   records: srs, 
   getByUuid: getSrByUuid,
   getByOpaqueRef: getSrByOpaqueRef
} = useSrCollection();

const {
   filteredrecords: vdis, 
   getByUuid: getVdiByUuid
} = useVdiCollection();

const currentHost = computed(() =>
  getSrByUuid(route.params.uuid as XenApiSr["uuid"])
);

const vdisOfSr = computed(() => vdis.value.filter((vdi) => getSrByOpaqueRef(vdi.SR)?.uuid == route.params.uuid));

const getVms = (vdi: XenApiVdi) => {
    const {getByOpaqueRef: getVbdByOpaqueRef} = useVbdCollection();
    const {getByOpaqueRef: getVmByOpaqueRef, records: vms} = useVmCollection();
    const {getByOpaqueRef: getVdiByOpaqueRef} = useVdiCollection();
    const vmtext: string[] = [];

    if (vdi.type === VDI_TYPE.CRASHDUMP) {
      vmtext.push("TODO: Implement Crashdump-VDIs");
      // see https://github.com/borzel/xenadmin/blob/master/XenModel/XenAPI-Extensions/VDI.cs#L93
    } else if (vdi.type == VDI_TYPE.SUSPEND) {
      vms.value.forEach(vm => {
          const suspendVdi = getVdiByOpaqueRef(vm.suspend_VDI) as XenApiVdi;
          if (suspendVdi != null && suspendVdi.uuid == vdi.uuid) {
            vmtext.push(vm?.name_label);
          }
        });
    } else {
      vdi.VBDs.forEach(vbdRef => {
        const vbd = getVbdByOpaqueRef(vbdRef) as XenApiVbd;
        const vm = getVmByOpaqueRef(vbd?.VM) as XenApiVm;
        vmtext.push(vm?.name_label);
      });
    }

    return vmtext.join(", ");
  };

</script>

<style lang="postcss" scoped>
.sr-vdis-view {
  overflow: auto;
  margin: 1rem;
}

.vdi-name {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
}
</style>
