import type { ModalController } from "@/types";
import { createEventHook } from "@vueuse/core";
import { defineStore } from "pinia";
import {
  type AsyncComponentLoader,
  computed,
  defineAsyncComponent,
  markRaw,
  reactive,
  ref,
} from "vue";

export const useModalStore = defineStore("modal", () => {
  const modals = ref(new Map<symbol, ModalController>());

  const close = (id: symbol) => {
    modals.value.delete(id);
  };

  const open = <T>(loader: AsyncComponentLoader, props: object) => {
    const id = Symbol();
    const isBusy = ref(false);
    const component = defineAsyncComponent(loader);

    const approveEvent = createEventHook<T>();
    const declineEvent = createEventHook();

    const approve = async (payload: any) => {
      try {
        isBusy.value = true;
        const result = await payload;
        await approveEvent.trigger(result);
        close(id);
      } finally {
        isBusy.value = false;
      }
    };

    const decline = async () => {
      try {
        isBusy.value = true;
        await declineEvent.trigger(undefined);
        close(id);
      } finally {
        isBusy.value = false;
      }
    };

    modals.value.set(
      id,
      reactive({
        id,
        component: markRaw(component),
        props,
        approve,
        decline,
        isBusy,
      })
    );

    return {
      onApprove: approveEvent.on,
      onDecline: declineEvent.on,
      id,
    };
  };

  return {
    open,
    close,
    modals: computed(() => modals.value.values()),
  };
});
