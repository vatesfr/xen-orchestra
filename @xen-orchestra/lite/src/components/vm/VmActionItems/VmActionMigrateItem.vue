<template>
  <MenuItem
    v-tooltip="
      !areAllVmsMigratable && $t('some-selected-vms-can-not-be-migrated')
    "
    :busy="isMigrating"
    :disabled="isParentDisabled || !areAllVmsMigratable"
    :icon="faRoute"
    @click="openModal"
  >
    {{ $t("migrate") }}
  </MenuItem>

  <UiModal v-model="isModalOpen">
    <FormModalLayout :disabled="isMigrating" @submit.prevent="handleMigrate">
      <template #title>
        {{ $t("migrate-n-vms", { n: selectedRefs.length }) }}
      </template>

      <div>
        <FormInputWrapper :label="$t('select-destination-host')" light>
          <FormSelect v-model="selectedHost">
            <option :value="undefined">
              {{ $t("select-destination-host") }}
            </option>
            <option
              v-for="host in availableHosts"
              :key="host.$ref"
              :value="host"
            >
              {{ host.name_label }}
            </option>
          </FormSelect>
        </FormInputWrapper>
      </div>

      <template #buttons>
        <UiButton outlined @click="closeModal">
          {{ isMigrating ? $t("close") : $t("cancel") }}
        </UiButton>
        <UiButton :busy="isMigrating" :disabled="!isValid" type="submit">
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

const props = defineProps<{
  selectedRefs: XenApiVm["$ref"][];
}>();

const isParentDisabled = useContext(DisabledContext);

const {
  open: openModal,
  isOpen: isModalOpen,
  close: closeModal,
} = useModal({
  onClose: () => (selectedHost.value = undefined),
});

const {
  selectedHost,
  availableHosts,
  isValid,
  migrate,
  isMigrating,
  areAllVmsMigratable,
} = useVmMigration(() => props.selectedRefs);

const handleMigrate = async () => {
  try {
    await migrate();
    closeModal();
  } catch (e) {
    console.error("Error while migrating", e);
  }
};
</script>
