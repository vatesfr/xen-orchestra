<template>
  <MenuItem
    v-tooltip="
      !areAllVmsAllowedToMigrate && $t('some-selected-vms-can-not-be-migrated')
    "
    :busy="isMigrating"
    :disabled="isParentDisabled || !areAllVmsAllowedToMigrate"
    :icon="faRoute"
    @click="openModal"
  >
    {{ $t("migrate") }}
  </MenuItem>

  <UiModal v-model="isModalOpen">
    <FormModalLayout
      :disabled="!isReady || isMigrating"
      @submit.prevent="handleMigrate"
    >
      <template #title>
        {{ $t("migrate-n-vms", { n: selectedRefs.length }) }}
      </template>

      <div>
        <FormInputWrapper :label="$t('select-destination-host')" light>
          <FormSelect v-model="selectedHostRef">
            <option :value="undefined">{{ $t("please-select") }}</option>
            <option
              v-for="host in availableHosts"
              :key="host.$ref"
              :value="host.$ref"
            >
              {{ host.name_label }}
            </option>
          </FormSelect>
        </FormInputWrapper>

        <FormInputWrapper
          v-if="selectedHostRef !== undefined"
          :label="$t('select-optional-migration-network')"
          light
        >
          <FormSelect v-model="selectedMigrationNetworkRef">
            <option :value="undefined">{{ $t("please-select") }}</option>
            <option
              v-for="network in availableNetworks"
              :key="network.$ref"
              :value="network.$ref"
            >
              {{ network.name_label }}
            </option>
          </FormSelect>
        </FormInputWrapper>

        <FormInputWrapper
          v-if="selectedMigrationNetworkRef !== undefined"
          :label="$t('select-destination-sr')"
          light
        >
          <FormSelect v-model="selectedSrRef">
            <option :value="undefined">{{ $t("please-select") }}</option>
            <option v-for="sr in availableSrs" :key="sr.$ref" :value="sr.$ref">
              {{ sr.name_label }}
            </option>
          </FormSelect>
        </FormInputWrapper>
      </div>

      <template #buttons>
        <UiButton outlined @click="closeModal" :disabled="false">
          {{ isMigrating ? $t("close") : $t("cancel") }}
        </UiButton>
        <UiButton
          :busy="isMigrating"
          :disabled="!canExecuteMigration"
          v-tooltip="notMigratableReason ?? false"
          type="submit"
        >
          {{ $t("migrate-n-vms", { n: selectedRefs.length }) }}
        </UiButton>
      </template>
    </FormModalLayout>
  </UiModal>
</template>

<script lang="ts" setup>
import FormInputWrapper from "@/components/form/FormInputWrapper.vue";
import FormSelect from "@/components/form/FormSelect.vue";
import MenuItem from "@/components/menu/MenuItem.vue";
import FormModalLayout from "@/components/ui/modals/layouts/FormModalLayout.vue";
import UiModal from "@/components/ui/modals/UiModal.vue";
import UiButton from "@/components/ui/UiButton.vue";
import { useContext } from "@/composables/context.composable";
import useModal from "@/composables/modal.composable";
import { useVmMigration } from "@/composables/vm-migration.composable";
import { DisabledContext } from "@/context";
import { vTooltip } from "@/directives/tooltip.directive";
import type { XenApiVm } from "@/libs/xen-api/xen-api.types";
import { faRoute } from "@fortawesome/free-solid-svg-icons";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  selectedRefs: XenApiVm["$ref"][];
}>();

const isParentDisabled = useContext(DisabledContext);

const { t } = useI18n();

const {
  open: openModal,
  isOpen: isModalOpen,
  close: closeModal,
} = useModal({
  confirmClose: () => {
    if (!isMigrating.value) {
      return true;
    }

    return confirm(t("migration-close-warning"));
  },
  onClose: () => (selectedHostRef.value = undefined),
});

const {
  isReady,
  selectedHostRef,
  selectedMigrationNetworkRef,
  selectedSrRef,
  availableHosts,
  availableNetworks,
  availableSrs,
  migrate,
  isMigrating,
  canExecuteMigration,
  notMigratableReason,
  areAllVmsAllowedToMigrate,
} = useVmMigration(() => props.selectedRefs);

const handleMigrate = async () => {
  await migrate();
  closeModal();
};
</script>
