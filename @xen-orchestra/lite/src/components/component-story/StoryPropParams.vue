<template>
  <UiModal v-if="isRawValueModalOpen" @close="closeRawValueModal">
    <CodeHighlight :code="rawValueModalPayload" />
  </UiModal>
  <StoryParamsTable>
    <thead>
      <tr>
        <th>Prop</th>
        <th>Type</th>
        <th><!-- Reset Default --></th>
        <th><!-- Widget --></th>
        <th>Default</th>
        <th>Help</th>
      </tr>
    </thead>
    <tfoot>
      <tr>
        <td class="reset-all" colspan="6">
          <span class="link" @click="emit('reset')">Reset</span>
        </td>
      </tr>
    </tfoot>
    <tbody>
      <tr
        v-for="param in params"
        :key="param.name"
        :class="{ required: param.isRequired() }"
        class="row"
      >
        <th class="name">
          {{ param.getFullName() }}
        </th>
        <td>
          <CodeHighlight :code="param.getTypeLabel()" />
        </td>
        <td class="reset-param">
          <UiIcon
            v-if="
              param.hasWidget() &&
              !param.isRequired() &&
              model[param.name] !== undefined
            "
            :icon="faClose"
            class="reset-icon"
            @click="model[param.name] = undefined"
          />
        </td>
        <td>
          <StoryWidget
            v-if="param.hasWidget() && param.name in model"
            v-model="model[param.name]"
            :required="param.isRequired()"
            :widget="param.getWidget()!"
          />
          <span
            v-else-if="model[param.name] !== undefined"
            class="link raw-value"
            @click.prevent="openRawValueModal(model[param.name])"
          >
            View current value
          </span>
        </td>
        <td>
          <code
            v-if="!param.isRequired()"
            :class="{ active: model[param.name] === undefined }"
            class="default-value"
          >
            {{ JSON.stringify(param.getDefaultValue()) ?? "undefined" }}
          </code>
          <span v-else>-</span>
        </td>
        <td class="help">
          {{ param.getHelp() }}
        </td>
      </tr>
    </tbody>
  </StoryParamsTable>
</template>

<script lang="ts" setup>
import CodeHighlight from "@/components/CodeHighlight.vue";
import StoryParamsTable from "@/components/component-story/StoryParamsTable.vue";
import StoryWidget from "@/components/component-story/StoryWidget.vue";
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import UiModal from "@/components/ui/UiModal.vue";
import useModal from "@/composables/modal.composable";
import useSortedCollection from "@/composables/sorted-collection.composable";
import type { PropParam } from "@/libs/story/story-param";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { useVModel } from "@vueuse/core";
import { toRef } from "vue";

const props = defineProps<{
  params: PropParam[];
  modelValue: Record<string, any>;
}>();

const params = useSortedCollection(toRef(props, "params"), (p1, p2) => {
  if (p1.isRequired() === p2.isRequired()) {
    return 0;
  }

  return p1.isRequired() ? -1 : 1;
});

const emit = defineEmits<{
  (event: "reset"): void;
  (event: "update:modelValue", value: any): void;
}>();

const model = useVModel(props, "modelValue", emit);

const {
  open: openRawValueModal,
  close: closeRawValueModal,
  isOpen: isRawValueModalOpen,
  payload: rawValueModalPayload,
} = useModal<string>();
</script>

<style lang="postcss" scoped>
.reset-param {
  text-align: center;
  width: 3rem;

  & > div {
    display: flex;
    align-items: center;
    padding: 0.4rem 0.6rem;
    cursor: pointer;
    color: var(--color-blue-scale-300);
    border-radius: 0.4rem;
    gap: 0.6rem;

    &.active {
      font-weight: 600;
      cursor: default;
      color: var(--color-green-infra-l20);
    }
  }
}

.reset-all {
  text-align: right;
  padding-top: 1.2rem;
}

.reset-icon {
  cursor: pointer;
}

.row:not(.required) {
  & > th {
    font-weight: normal;
    opacity: 0.7;
  }
}

.help {
  font-style: italic;
  color: var(--color-blue-scale-200);
}

.default-value {
  font-style: italic;
  opacity: 0.2;

  &.active {
    font-weight: 600;
    font-style: normal;
    opacity: 1;
    color: var(--color-green-infra-base);
  }
}
</style>
