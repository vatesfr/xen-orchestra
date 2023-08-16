<template>
  <UiIcon
    :class="textClass"
    :icon="faXmark"
    class="modal-close-icon"
    @click="close"
  />
</template>

<script lang="ts" setup>
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import { useColorContext } from "@/composables/color-context.composable";
import { IK_MODAL_CLOSE } from "@/types/injection-keys";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { inject } from "vue";

const { textClass } = useColorContext();

const close = inject(IK_MODAL_CLOSE, undefined);
</script>

<style lang="postcss" scoped>
.modal-close-icon {
  font-size: 2rem;
  cursor: pointer;
}
</style>
