<template>
  <UiDrawer @confirm="onSubmit()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('user:create-new') }}
    </template>

    <template #content>
      <UiAlert v-if="errorMessage !== undefined" accent="danger" class="error">
        {{ errorMessage }}
      </UiAlert>

      <UiStepper :steps :current-step="currentStepIndex">
        <div v-if="currentStep === 'details'" class="details">
          <UserFormTextInput v-bind="usernameInputBindings" class="full-row" />
          <UserFormTextInput v-bind="firstnameInputBindings" />
          <UserFormTextInput v-bind="lastnameInputBindings" />
          <UserFormTextInput v-bind="emailInputBindings" class="full-row" />
          <UserFormTextInput v-bind="passwordInputBindings" />
          <UserFormTextInput v-bind="passwordConfirmationInputBindings" />
        </div>

        <NewUserGroupsTable
          v-show="currentStep === 'groups'"
          v-model:selected-group-ids="formData.groups.groupIds"
          :groups="selectableGroups"
          :busy="!areGroupsReady"
          :error="hasGroupFetchError"
        />

        <NewUserRolesTable
          v-show="currentStep === 'roles'"
          v-model:selected-role-ids="formData.roles.roleIds"
          :roles
          :inherited-role-ids
          :busy="!areRolesReady || !areGroupsReady"
          :error="hasRoleFetchError || hasGroupFetchError"
        />

        <NewUserReview
          v-if="currentStep === 'review'"
          :details="formData.details"
          :groups="selectedGroups"
          :direct-role-ids
          @edit="step => backTo(step)"
        />
      </UiStepper>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton v-if="currentStep === 'details'" @click="emit('cancel')" />
      <VtsOverlayButton v-else variant="secondary" @click="back()">
        {{ t('action:go-back') }}
      </VtsOverlayButton>
      <VtsOverlayConfirmButton>
        {{ currentStep === 'review' ? t('action:create') : t('action:continue') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import { useXoGroupCollection } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import { useXoRoleCollection } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import NewUserGroupsTable from '@/modules/user/components/drawer/NewUserGroupsTable.vue'
import NewUserReview from '@/modules/user/components/drawer/NewUserReview.vue'
import NewUserRolesTable from '@/modules/user/components/drawer/NewUserRolesTable.vue'
import UserFormTextInput from '@/modules/user/components/form/inputs/UserFormTextInput.vue'
import { useNewUserForm } from '@/modules/user/form/new/use-new-user-form.ts'
import type { NewUserPayload } from '@/modules/user/types.ts'
import type { StepDefinition } from '@core/components/ui/stepper/UiStepper.vue'
import VtsOverlayButton from '@core/components/overlay/VtsOverlayButton.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiStepper from '@core/components/ui/stepper/UiStepper.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { errorMessage } = defineProps<{
  errorMessage?: string
}>()

const emit = defineEmits<{
  confirm: [payload: NewUserPayload]
  cancel: []
}>()

const { t } = useI18n()

const {
  formData,
  selectedGroups,
  inheritedRoleIds,
  directRoleIds,
  currentStep,
  next,
  back,
  backTo,
  usernameInputBindings,
  firstnameInputBindings,
  lastnameInputBindings,
  emailInputBindings,
  passwordInputBindings,
  passwordConfirmationInputBindings,
  validateAndBuildPayload,
} = useNewUserForm()

const { groups, areGroupsReady, hasGroupFetchError } = useXoGroupCollection()

const { roles, areRolesReady, hasRoleFetchError } = useXoRoleCollection()

const selectableGroups = computed(() => groups.value.filter(group => group.provider === undefined))

const steps = computed<StepDefinition[]>(() => [
  { label: t('user:details') },
  { label: t('user:groups-assignment') },
  { label: t('user:roles-assignment') },
  { label: t('review-and-confirm') },
])

const stepNames = ['details', 'groups', 'roles', 'review'] as const

const currentStepIndex = computed(() => stepNames.indexOf(currentStep.value))

async function onSubmit() {
  if (currentStep.value !== 'review') {
    await next()

    return
  }

  const payload = await validateAndBuildPayload()

  if (payload !== undefined) {
    emit('confirm', payload)
  }
}
</script>

<style lang="postcss" scoped>
.error {
  margin-block-end: 2.4rem;
}

.details {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  @media (--medium-or-large) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    align-items: start;

    .full-row {
      grid-column: 1 / -1;
      max-width: calc(50% - 1.2rem);
    }
  }
}
</style>
