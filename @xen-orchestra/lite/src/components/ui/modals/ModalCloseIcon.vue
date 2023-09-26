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
import { useContext } from "@/composables/context.composable";
import { ColorContext } from "@/context";
import { IK_MODAL_CLOSE } from "@/types/injection-keys";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { inject } from "vue";

const { textClass } = useContext(ColorContext);

const close = inject(IK_MODAL_CLOSE, undefined);
</script>

<style lang="postcss" scoped>
.modal-close-icon {
  font-size: 2rem;
  cursor: pointer;
}
</style>
