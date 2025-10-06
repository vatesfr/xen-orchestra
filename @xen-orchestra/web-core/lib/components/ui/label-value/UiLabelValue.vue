<!-- v3 -->
<template>
  <div class="ui-label-value typo-body-regular">
    <div class="ui-label-value-grid-container">
      <div class="label">
        {{ label }}
      </div>
      <div class="value">
        <div class="valueAddonWraper">
          <slot name="value">
            <div
              v-if="value && !Array.isArray(value)"
              v-tooltip
              :class="ellipsis == true ? 'text-ellipsis' : 'text-wrap'"
            >
              {{ value }}
            </div>
            <UiTagsList v-else-if="Array.isArray(value) && value.length > 0" :class="{ 'text-ellipsis': ellipsis }">
              <!-- #TODO fix toolTip -->
              <UiTag v-for="tag in value" :key="tag" v-tooltip="tag" accent="info" variant="secondary">
                {{ tag }}
              </UiTag>
            </UiTagsList>
          </slot>
          <div v-if="slots.addons">
            <slot name="addons" />
          </div>
        </div>

        <div
          v-if="slots.actions || (copyValue != undefined && (Array.isArray(copyValue) ? copyValue.length > 0 : true))"
          class="actions"
        >
          <VtsCopyButton
            v-if="
              copyValue !== undefined &&
              copyValue !== '' &&
              !slots.actions &&
              (Array.isArray(copyValue) ? copyValue.length > 0 : true)
            "
            :value="Array.isArray(copyValue) ? copyValue.join(', ') : copyValue"
          />
          <slot name="actions" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import UiTag from '../tag/UiTag.vue'
import UiTagsList from '../tag/UiTagsList.vue'

const { value, copyValue } = defineProps<{
  label: string
  value?: string | string[]
  ellipsis?: boolean
  copyValue?: string | string[]
}>()

const slots = defineSlots<{
  value?(): any
  addons?(): any
  actions?(): any
}>()
</script>

<style lang="postcss" scoped>
.ui-label-value {
  container-type: inline-size;
  container-name: card;

  .ui-label-value-grid-container {
    display: grid;
  }

  @container card (max-width: 32rem) {
    .ui-label-value-grid-container {
      grid-template-columns: 1fr;

      .label {
        grid-column: 1;
        grid-row: 1;
      }

      .value {
        grid-column: 1;
        grid-row: 2;
        width: 100cqi;
      }
    }
  }

  @container card (min-width: 32rem) {
    .ui-label-value-grid-container {
      grid-template-columns: 20rem calc(100% - 20rem);

      .label {
        grid-column: 1;
        grid-row: 1;
      }

      .value {
        grid-column: 2;
        grid-row: 1;
        align-items: left;
        width: 100%;
      }
    }
  }

  .ui-label-value-grid-container {
    .label {
      color: var(--color-neutral-txt-secondary);
    }

    .value {
      display: flex;
      flex-direction: row;
      justify-content: space-between;

      .valueAddonWraper {
        display: flex;
        align-items: center;
        overflow: hidden;
        white-space: nowrap;
        gap: 0.8rem;

        .text-wrap {
          text-wrap: wrap;
          overflow-wrap: anywhere;
        }
      }

      .valueAddonWraper:empty::before {
        content: '-';
      }
    }
  }
}
</style>
