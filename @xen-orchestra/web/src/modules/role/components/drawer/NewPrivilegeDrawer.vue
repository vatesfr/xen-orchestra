<template>
  <UiDrawer @confirm="onSubmit()" @dismiss="emit('cancel')">
    <template #title>
      {{ privilegeToEdit === undefined ? t('privilege:create-new') : t('privilege:edit') }}
    </template>

    <template #content>
      <UiStepper :steps :current-step="currentStepIndex">
        <div v-if="currentStep === 'details'" class="fields">
          <RoleFormSelect v-bind="resourceSelectBindings" />
          <RoleFormSelect v-bind="actionsSelectBindings" />
          <RoleFormSelect v-bind="effectSelectBindings" />
        </div>

        <div v-else-if="currentStep === 'scope'" class="scope">
          <UiRadioButtonGroup accent="brand" gap="wide" :label="t('privilege:scope-type')">
            <UiRadioButton
              v-for="scopeType of PRIVILEGE_SCOPE_TYPES"
              :key="scopeType"
              v-model="formData.scope.scopeType"
              accent="brand"
              :value="scopeType"
              :disabled="!availableScopeTypes.includes(scopeType)"
            >
              {{ scopeTypeLabels[scopeType] }}
            </UiRadioButton>
          </UiRadioButtonGroup>

          <div
            v-if="formData.scope.scopeType === 'manual-selection' && selectableResource !== undefined"
            class="selector"
          >
            <PrivilegeScopeManualSelection
              v-model:selected-ids="formData.scope.selectedIds"
              :resource="selectableResource"
            />
            <UiInfo v-if="selectedIdsError !== undefined" accent="danger" wrap>
              {{ selectedIdsError }}
            </UiInfo>
          </div>

          <template v-else-if="formData.scope.scopeType === 'dynamic-selection'">
            <div class="selector">
              <VtsQueryBuilder v-model="formData.scope.selector" :schema="selectorSchema" @search="applySelector()" />
              <UiInfo :accent="selectorMessage.accent" wrap>
                {{ selectorMessage.content }}
              </UiInfo>
            </div>
            <PrivilegeScopePreviewTable
              v-if="isSelectorPreviewEnabled && selectableResource !== undefined"
              :resource="selectableResource"
              :matches="selectorMatches"
              :is-ready="areSelectorMatchesReady"
              :has-error="hasSelectorMatchesError"
            />
          </template>
        </div>

        <div v-else class="review">
          <UiTitle>
            {{ t('privilege:details') }}
            <template #action>
              <UiButton left-icon="fa:edit" variant="tertiary" accent="brand" size="medium" @click="backTo('details')">
                {{ t('action:edit') }}
              </UiButton>
            </template>
          </UiTitle>

          <dl class="review-fields">
            <dt>{{ t('privilege:resource') }}</dt>
            <dd>{{ formData.details.resource }}</dd>

            <dt>{{ t('privilege:action') }}</dt>
            <dd>{{ formData.details.actions.join(', ') }}</dd>

            <dt>{{ t('privilege:effect') }}</dt>
            <dd>
              <UiTagsList>
                <UiTag :accent="EFFECT_ACCENTS[formData.details.effect]" variant="secondary">
                  {{ t(formData.details.effect) }}
                </UiTag>
              </UiTagsList>
            </dd>
          </dl>

          <UiTitle class="scope-title">
            {{ t('privilege:scope') }}
            <template #action>
              <UiButton left-icon="fa:edit" variant="tertiary" accent="brand" size="medium" @click="backTo('scope')">
                {{ t('action:edit') }}
              </UiButton>
            </template>
          </UiTitle>

          <dl class="review-fields">
            <dt>{{ t('privilege:scope-type') }}</dt>
            <dd>{{ scopeTypeLabels[formData.scope.scopeType] }}</dd>

            <template v-if="formData.scope.scopeType === 'manual-selection' && selectableResource !== undefined">
              <dt class="top-aligned">{{ t('privilege:scope') }}</dt>
              <dd>
                <PrivilegeScopeObjectsList :resource="selectableResource" :ids="formData.scope.selectedIds" />
              </dd>
            </template>

            <template v-if="formData.scope.scopeType === 'dynamic-selection' && selectableResource !== undefined">
              <dt class="top-aligned">{{ t('privilege:selector') }}</dt>
              <dd>
                <UiLogEntryViewer :content="formData.scope.selector" size="medium" accent="info" />
              </dd>

              <dt class="top-aligned">{{ t('privilege:scope-preview') }}</dt>
              <dd class="scope-preview">
                <PrivilegeScopeObjectsList :resource="selectableResource" :ids="selectorMatchIds" />
              </dd>
            </template>
          </dl>
        </div>
      </UiStepper>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton v-if="currentStep === 'details'" @click="emit('cancel')" />
      <VtsOverlayButton v-else variant="secondary" @click="back()">
        {{ t('action:go-back') }}
      </VtsOverlayButton>
      <VtsOverlayConfirmButton>
        {{ confirmLabel }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import PrivilegeScopeManualSelection from '@/modules/role/components/drawer/scope/PrivilegeScopeManualSelection.vue'
import PrivilegeScopeObjectsList from '@/modules/role/components/drawer/scope/PrivilegeScopeObjectsList.vue'
import PrivilegeScopePreviewTable from '@/modules/role/components/drawer/scope/PrivilegeScopePreviewTable.vue'
import RoleFormSelect from '@/modules/role/components/form/inputs/RoleFormSelect.vue'
import { usePrivilegeScopeTypeLabels } from '@/modules/role/composables/use-privilege-scope-type-labels.composable.ts'
import { useNewPrivilegeForm } from '@/modules/role/form/new-privilege/use-new-privilege-form.ts'
import type { NewPrivilegePayload } from '@/modules/role/types.ts'
import { PRIVILEGE_SCOPE_TYPES } from '@/modules/role/utils/privilege-scope.util.ts'
import { EFFECT_ACCENTS } from '@/modules/role/utils/xo-privilege.util.ts'
import type { InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import type { StepDefinition } from '@core/components/ui/stepper/UiStepper.vue'
import VtsOverlayButton from '@core/components/overlay/VtsOverlayButton.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import UiStepper from '@core/components/ui/stepper/UiStepper.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { privilegeToEdit } = defineProps<{
  privilegeToEdit?: NewPrivilegePayload
}>()

const emit = defineEmits<{
  confirm: [privileges: NewPrivilegePayload[]]
  cancel: []
}>()

const { t } = useI18n()

const scopeTypeLabels = usePrivilegeScopeTypeLabels()

const {
  formData,
  currentStep,
  next,
  back,
  backTo,
  resourceSelectBindings,
  actionsSelectBindings,
  effectSelectBindings,
  selectableResource,
  availableScopeTypes,
  selectorSchema,
  selectorError,
  applySelector,
  selectedIdsError,
  isSelectorPreviewEnabled,
  selectorMatches,
  areSelectorMatchesReady,
  hasSelectorMatchesError,
  validateAndBuildPayloads,
} = useNewPrivilegeForm(privilegeToEdit)

const selectorMatchIds = computed(() => selectorMatches.value.map(match => match.id))

const steps = computed<StepDefinition[]>(() => [
  { label: t('privilege:details') },
  { label: t('privilege:select-scope') },
  { label: t('privilege:review-and-confirm') },
])

const selectorMessage = computed<{ content: string; accent: InfoAccent }>(() => {
  if (selectorError.value !== undefined) {
    return { content: selectorError.value, accent: 'danger' }
  }

  return { content: t('privilege:dynamic-selection-info'), accent: 'info' }
})

const confirmLabel = computed(() => {
  if (currentStep.value !== 'review') {
    return t('action:continue')
  }

  return privilegeToEdit === undefined ? t('action:create') : t('action:save')
})

const stepNames = ['details', 'scope', 'review'] as const

const currentStepIndex = computed(() => stepNames.indexOf(currentStep.value))

async function onSubmit() {
  if (currentStep.value !== 'review') {
    await next()

    return
  }

  const privileges = await validateAndBuildPayloads()

  if (privileges !== undefined) {
    emit('confirm', privileges)
  }
}
</script>

<style lang="postcss" scoped>
.fields {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  @media (--medium-or-large) {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    align-items: start;
  }
}

.scope {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .selector {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}

.review {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.6rem 6.4rem;

  > * {
    grid-column: 1 / -1;
  }

  .scope-title {
    margin-block-start: 1.6rem;
  }

  .review-fields {
    display: grid;
    grid-template-columns: subgrid;
    align-items: center;
    row-gap: 0.8rem;
    margin: 0;
  }

  dt {
    color: var(--color-neutral-txt-secondary);

    &.top-aligned {
      align-self: start;
    }
  }

  dd {
    margin: 0;
  }

  .scope-preview {
    max-height: 24rem;
    overflow: auto;
  }
}
</style>
