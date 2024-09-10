<template>
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
      <tr v-for="param in params" :key="param.name" :class="{ required: param.isRequired() }" class="row">
        <th class="name">
          {{ param.getFullName() }}
          <sup
            v-if="param.isVModel()"
            v-tooltip="`[Model] Can be used with ${param.getVModelDirective()}`"
            class="v-model-indicator"
          >
            <UiIcon :icon="faRepeat" />
          </sup>
          <sup
            v-if="param.isUsingContext()"
            v-tooltip="
              `If this prop is not provided, value will be read from context. Otherwise, context will be updated with this prop value.`
            "
            class="context-indicator"
          >
            Ctx
          </sup>
        </th>
        <td>
          <CodeHighlight :code="param.getTypeLabel()" />
        </td>
        <td class="reset-param">
          <UiIcon
            v-if="param.hasWidget() && !param.isRequired() && model[param.name] !== undefined"
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
          <code v-if="!param.isRequired()" :class="{ active: model[param.name] === undefined }" class="default-value">
            {{ JSON.stringify(param.getDefaultValue()) ?? 'undefined' }}
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
import CodeHighlight from '@/components/CodeHighlight.vue'
import StoryParamsTable from '@/components/component-story/StoryParamsTable.vue'
import StoryWidget from '@/components/component-story/StoryWidget.vue'
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import { useModal } from '@/composables/modal.composable'
import useSortedCollection from '@/composables/sorted-collection.composable'
import type { PropParam } from '@/libs/story/story-param'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faClose, faRepeat } from '@fortawesome/free-solid-svg-icons'
import { useVModel } from '@vueuse/core'
import { toRef } from 'vue'

const props = defineProps<{
  params: PropParam[]
  modelValue: Record<string, any>
}>()

const emit = defineEmits<{
  reset: []
  'update:modelValue': [value: any]
}>()

const params = useSortedCollection(toRef(props, 'params'), (p1, p2) => {
  if (p1.isRequired() === p2.isRequired()) {
    return 0
  }

  return p1.isRequired() ? -1 : 1
})

const model = useVModel(props, 'modelValue', emit)

const openRawValueModal = (code: string) =>
  useModal(() => import('@/components/modals/CodeHighlightModal.vue'), {
    code,
  })
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
    color: var(--color-neutral-txt-secondary);
    border-radius: 0.4rem;
    gap: 0.6rem;

    &.active {
      font-weight: 600;
      cursor: default;
      color: var(--color-success-item-hover);
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
  color: var(--color-neutral-txt-secondary);
}

.default-value {
  font-style: italic;
  opacity: 0.2;

  &.active {
    font-weight: 600;
    font-style: normal;
    opacity: 1;
    color: var(--color-success-txt-base);
  }
}

.v-model-indicator,
.context-indicator {
  color: var(--color-success-txt-base);
}
</style>
