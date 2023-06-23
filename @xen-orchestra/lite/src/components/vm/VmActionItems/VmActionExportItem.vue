<template>
  <MenuItem :icon="faFileExport">
    {{ $t("export") }}
    <template #submenu>
      <MenuItem
        v-tooltip="{ content: $t('coming-soon'), placement: 'left' }"
        :icon="faDisplay"
      >
        {{ $t("export-vms") }}
      </MenuItem>
      <MenuItem
        v-tooltip="{ content: $t('coming-soon'), placement: 'left' }"
        :icon="faCode"
      >
        {{ $t("export-table-to", { type: ".json" }) }}
      </MenuItem>
      <MenuItem
        :icon="faFileCsv"
        @click="
          exportVmsAsCsvFile(vmRefs, `vms_${new Date().toISOString()}.csv`)
        "
      >
        {{ $t("export-table-to", { type: ".csv" }) }}
      </MenuItem>
    </template>
  </MenuItem>
</template>

<script lang="ts" setup>
import { exportVmsAsCsvFile } from "@/libs/vm";
import MenuItem from "@/components/menu/MenuItem.vue";
import {
  faCode,
  faDisplay,
  faFileCsv,
  faFileExport,
} from "@fortawesome/free-solid-svg-icons";
import { vTooltip } from "@/directives/tooltip.directive";

defineProps<{
  vmRefs: string[];
}>();
</script>
