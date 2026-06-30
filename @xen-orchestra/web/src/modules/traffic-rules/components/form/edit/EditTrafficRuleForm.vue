<template>
  <VtsForm class="new-traffic-rule-form" @submit="onSubmit()">
    <div class="row">
      <TrafficRuleFormSelect v-bind="allowSelectBindings">
        <template #option="{ option }">
          <VtsOption :option>
            <span class="option-content">
              <VtsStatus v-if="option.properties.status" :status="option.properties.status" icon-only />
              {{ option.properties.label }}
            </span>
          </VtsOption>
        </template>
      </TrafficRuleFormSelect>
      <TrafficRuleFormSelect v-bind="protocolSelectBindings" />
      <TrafficRuleFormNumberInput v-if="hasPort" v-bind="portInputBindings" />
    </div>

    <div class="row">
      <TrafficRuleFormSelect v-bind="directionSelectBindings" />
      <TrafficRuleFormTextInput v-bind="ipRangeInputBindings" />
    </div>

    <div class="row target-row" />
  </VtsForm>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import TrafficRuleFormNumberInput from '@/modules/traffic-rules/components/form/new/inputs/TrafficRuleFormNumberInput.vue'
import TrafficRuleFormSelect from '@/modules/traffic-rules/components/form/new/inputs/TrafficRuleFormSelect.vue'
import TrafficRuleFormTextInput from '@/modules/traffic-rules/components/form/new/inputs/TrafficRuleFormTextInput.vue'
import { useEditTrafficRuleForm } from '@/modules/traffic-rules/form/edit/use-edit-traffic-rule-form.ts'
import type { EditTrafficRulePayload } from '@/modules/traffic-rules/jobs/xo-traffic-rule-edit.job.ts'
import VtsForm from '@core/components/form/VtsForm.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import type { TrafficRule } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { rule } = defineProps<{
  rule: TrafficRule
}>()

const emit = defineEmits<{
  create: [data: EditTrafficRulePayload]
}>()

const { t } = useI18n()

const { getNetworkById } = useXoNetworkCollection()

const targetType = computed(() => {
  if (rule.type === 'network') {
    return t('network')
  }
  return t('vif')
})

const targetLabel = computed(() => {
  if (rule.type === 'network') {
    return getNetworkById(rule.networkId)?.name_label ?? t('unknown')
  }
  console.log('pas network')
  return undefined
})

const {
  hasPort,
  allowSelectBindings,
  protocolSelectBindings,
  portInputBindings,
  directionSelectBindings,
  ipRangeInputBindings,
  validateAndBuildPayload,
} = useEditTrafficRuleForm(() => rule)

async function onSubmit() {
  const payload = await validateAndBuildPayload()

  if (payload !== undefined) {
    emit('create', payload)
  }
}
</script>

<style lang="postcss" scoped>
.option-content {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
}

.new-traffic-rule-form {
  .row {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;

    & > * {
      width: 100%;
      min-width: 0;
    }

    &:not(:first-child) {
      margin-block-start: 2.4rem;
    }

    @media (--medium-or-large) {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2.4rem;
      max-width: 78rem;

      & > * {
        width: auto;
      }
    }
  }

  @media (--medium-or-large) {
    .row:nth-child(2) > :nth-child(2) {
      grid-column: 2 / 4;
    }

    .target-row:has(> :nth-child(3):last-child) > :nth-child(3) {
      grid-column: 3 / -1;
    }

    .target-row {
      align-items: start;

      .prefix-wrapper {
        place-self: end;

        .prefix {
          height: 4rem;
          display: flex;
          align-items: center;
          color: var(--color-neutral-txt-secondary);
        }
      }
    }
  }
}
</style>
