<template>
  <div class="wrapper-spinner" v-if="store.isLoading">
    <UiSpinner class="spinner" />
  </div>
  <ObjectNotFoundView :id="id" v-else-if="isRecordNotFound" />
  <slot v-else />
</template>
<script lang="ts" setup>
import ObjectNotFoundView from "@/views/ObjectNotFoundView.vue";
import UiSpinner from "@/components/ui/UiSpinner.vue";
import { useHostStore } from "@/stores/host.store";
import { useVmStore } from "@/stores/vm.store";
import { computed } from "vue";
import { useRouter } from "vue-router";
import { inject } from "vue";
import {
  XOLITE_SUFFIX,
  type XoLiteTitleComposable,
} from "@/composables/xo-lite-title.composable";
import { whenever } from "@vueuse/core";
import { useI18n } from "vue-i18n";

const storeByType = {
  vm: useVmStore,
  host: useHostStore,
};

const props = defineProps<{ objectType: "vm" | "host"; id?: string }>();

const store = storeByType[props.objectType]();
const { currentRoute } = useRouter();
const { t } = useI18n();

const xoLiteTitle = inject<XoLiteTitleComposable>("xoLiteTitle");

const id = computed(
  () => props.id ?? (currentRoute.value.params.uuid as string)
);
const isRecordNotFound = computed(
  () => store.isReady && !store.hasRecordByUuid(id.value)
);

whenever(isRecordNotFound, () => {
  xoLiteTitle?.setTitle(t("not-found").concat(XOLITE_SUFFIX));
});
</script>

<style scoped>
.wrapper-spinner {
  display: flex;
  height: 100%;
}

.spinner {
  color: var(--color-extra-blue-base);
  display: flex;
  margin: auto;
  width: 10rem;
  height: 10rem;
}
</style>
