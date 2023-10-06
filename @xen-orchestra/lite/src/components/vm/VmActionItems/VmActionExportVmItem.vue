<template>
  <MenuItem
    :icon="faDisplay"
    @click="
      (e) => {
        console.log('foo');
        open(e);
      }
    "
  >
    {{ $t("export-vms") }}
  </MenuItem>

  <UiModal v-model="isOpen">
    <ConfirmModalLayout :icon="faDisplay">
      <template #title> </template>

      <template #subtitle> </template>

      <template #buttons> </template>
    </ConfirmModalLayout>
  </UiModal>
</template>

<script lang="ts" setup>
import ConfirmModalLayout from "@/components/ui/modals/layouts/ConfirmModalLayout.vue";
import MenuItem from "@/components/menu/MenuItem.vue";
import UiModal from "@/components/ui/modals/UiModal.vue";
import UiButton from "@/components/ui/UiButton.vue";
import useModal from "@/composables/modal.composable";
import { faDisplay } from "@fortawesome/free-solid-svg-icons";

const { close, open, isOpen } = useModal();
</script>
