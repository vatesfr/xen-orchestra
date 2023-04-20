<template>
  <div v-if="!isDisabled" ref="tooltipElement" class="app-tooltip">
    <span class="triangle" />
    <span class="label">{{ content }}</span>
  </div>
</template>

<script lang="ts" setup>
import { isEmpty, isFunction, isString } from "lodash-es";
import place from "placement.js";
import { computed, ref, watchEffect } from "vue";
import type { TooltipOptions } from "@/stores/tooltip.store";

const props = defineProps<{
  target: HTMLElement;
  options: TooltipOptions;
}>();

const tooltipElement = ref<HTMLElement>();

const content = computed(() =>
  isString(props.options) ? props.options : props.options.content
);

const isDisabled = computed(() => {
  if (isEmpty(content.value)) {
    return true;
  }

  if (isString(props.options)) {
    return false;
  }

  if (isFunction(props.options.disabled)) {
    return props.options.disabled(props.target);
  }

  return props.options.disabled ?? false;
});

const placement = computed(() =>
  isString(props.options) ? "top" : props.options.placement ?? "top"
);

watchEffect(() => {
  if (tooltipElement.value) {
    place(props.target, tooltipElement.value, {
      placement: placement.value,
    });
  }
});
</script>

<style lang="postcss" scoped>
.app-tooltip {
  font-size: 1.6rem;
  font-weight: 400;
  position: relative;
  display: inline-flex;
  padding: 0.3125em 0.5em;
  pointer-events: none;
  color: var(--color-blue-scale-500);
  border-radius: 0.5em;
  background-color: var(--color-blue-scale-100);
  z-index: 2;
}

.triangle {
  position: absolute;
  overflow: hidden;
  width: 1.875em;
  height: 1.875em;
}

[data-placement^="top"] {
  margin-bottom: 0.625em;

  .triangle {
    bottom: -1.75em;
    transform: rotate(180deg);
  }
}

[data-placement^="right"] {
  margin-left: 0.625em;

  .triangle {
    left: -1.75em;
    transform: rotate(270deg);
  }
}

[data-placement^="bottom"] {
  margin-top: 0.625em;

  .triangle {
    top: -1.75em;
  }
}

[data-placement^="left"] {
  margin-right: 0.625em;

  .triangle {
    right: -1.75em;
    transform: rotate(90deg);
  }
}

[data-placement="top-start"] .triangle {
  left: 0;
}

[data-placement="top-center"] .triangle {
  left: 50%;
  margin-left: -0.9375em;
}

[data-placement="top-end"] .triangle {
  right: 0;
}

[data-placement="left-start"] .triangle {
  top: -0.25em;
}

[data-placement="left-center"] .triangle {
  top: 50%;
  margin-top: -0.9375em;
}

[data-placement="left-end"] .triangle {
  bottom: -0.25em;
}

[data-placement="right-start"] .triangle {
  top: -0.25em;
}

[data-placement="right-center"] .triangle {
  top: 50%;
  margin-top: -0.9375em;
}

[data-placement="right-end"] .triangle {
  bottom: -0.25em;
}

[data-placement="bottom-center"] .triangle {
  left: 50%;
  margin-left: -0.9375em;
}

[data-placement="bottom-end"] .triangle {
  right: 0;
}

.triangle::after {
  display: block;
  width: 100%;
  height: 100%;
  margin-top: 1.875em;
  content: "";
  transform: rotate(45deg) skew(20deg, 20deg);
  border-radius: 0.3125em;
  background-color: var(--color-blue-scale-100);
}
</style>
