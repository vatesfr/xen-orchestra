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

    <div class="row target-row">
      <span class="prefix-wrapper">
        <span class="prefix">{{ t('on') }}</span>
      </span>
      <TrafficRuleFormSelect v-bind="targetTypeSelectBindings" />
      <TrafficRuleFormSelect v-if="isVifTarget" v-bind="vmSelectBindings">
        <template #option="{ option }">
          <VtsOption :option>
            <span class="option-content">
              <VtsIcon v-if="option.properties.icon" :name="option.properties.icon" size="medium" />
              {{ option.properties.label }}
              <span v-if="option.properties.disabled" class="no-vif typo-body-regular-small">{{
                t('no-vif-detected')
              }}</span>
            </span>
          </VtsOption>
        </template>
      </TrafficRuleFormSelect>
      <TrafficRuleFormSelect v-bind="targetSelectBindings">
        <template #option="{ option }">
          <VtsOption :option>
            <span class="option-content">
              <VtsIcon v-if="option.properties.icon" :name="option.properties.icon" size="medium" />
              {{ option.properties.label }}
            </span>
          </VtsOption>
        </template>
      </TrafficRuleFormSelect>
    </div>
    <NewTrafficRuleButtonsSection :cancel-to :submit-label="t('action:create-traffic-rule')" />
  </VtsForm>
</template>

<script setup lang="ts">
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import TrafficRuleFormNumberInput from '@/modules/traffic-rules/components/form/inputs/TrafficRuleFormNumberInput.vue'
import TrafficRuleFormSelect from '@/modules/traffic-rules/components/form/inputs/TrafficRuleFormSelect.vue'
import TrafficRuleFormTextInput from '@/modules/traffic-rules/components/form/inputs/TrafficRuleFormTextInput.vue'
import NewTrafficRuleButtonsSection from '@/modules/traffic-rules/components/form/new/NewTrafficRuleButtonsSection.vue'
import { useNewTrafficRuleForm } from '@/modules/traffic-rules/form/new/use-new-traffic-rule-form.ts'
import type { TrafficRulePayload } from '@/modules/traffic-rules/jobs/xo-traffic-rule-create.job.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import VtsForm from '@core/components/form/VtsForm.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

const { poolId, vifId } = defineProps<{
  poolId?: FrontXoPool['id']
  vifId?: FrontXoVif['id']
  cancelTo: RouteLocationRaw
}>()

const emit = defineEmits<{
  create: [data: TrafficRulePayload]
}>()

const { t } = useI18n()

const {
  isVifTarget,
  hasPort,
  allowSelectBindings,
  protocolSelectBindings,
  portInputBindings,
  directionSelectBindings,
  ipRangeInputBindings,
  targetTypeSelectBindings,
  vmSelectBindings,
  targetSelectBindings,
  validateAndBuildPayload,
} = useNewTrafficRuleForm(
  () => poolId,
  () => vifId
)

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

  .no-vif {
    &::before {
      content: '\2014';
      margin-inline-end: 0.8rem;
    }
  }
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
