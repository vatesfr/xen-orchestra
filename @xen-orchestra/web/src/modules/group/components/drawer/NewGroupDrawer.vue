<template>
  <UiDrawer @confirm="onSubmit()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('group:create-new') }}
    </template>

    <template #content>
      <UiAlert v-if="errorMessage !== undefined" accent="danger" class="error">
        {{ errorMessage }}
      </UiAlert>

      <UiStepper :steps :current-step="currentStepIndex">
        <GroupFormTextInput v-if="currentStep === 'details'" v-bind="nameInputBindings" class="name" />

        <RolesSelectionTable
          v-show="currentStep === 'roles'"
          v-model:selected-role-ids="formData.roles.roleIds"
          :roles
          :busy="!areRolesReady"
          :error="hasRoleFetchError"
        />

        <UsersSelectionTable
          v-show="currentStep === 'users'"
          v-model:selected-user-ids="formData.users.userIds"
          :users
          :busy="!areUsersReady"
          :error="hasUserFetchError"
        />

        <NewGroupReview
          v-if="currentStep === 'review'"
          :name="formData.details.name"
          :role-ids="formData.roles.roleIds"
          :user-ids="formData.users.userIds"
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
import NewGroupReview from '@/modules/group/components/drawer/NewGroupReview.vue'
import GroupFormTextInput from '@/modules/group/components/form/inputs/GroupFormTextInput.vue'
import { useNewGroupForm } from '@/modules/group/form/new/use-new-group-form.ts'
import type { NewGroupPayload } from '@/modules/group/types.ts'
import RolesSelectionTable from '@/modules/role/components/drawer/RolesSelectionTable.vue'
import { useXoRoleCollection } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import UsersSelectionTable from '@/modules/user/components/drawer/UsersSelectionTable.vue'
import { useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
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
  confirm: [payload: NewGroupPayload]
  cancel: []
}>()

const { t } = useI18n()

const { formData, currentStep, next, back, backTo, nameInputBindings, validateAndBuildPayload } = useNewGroupForm()

const { roles, areRolesReady, hasRoleFetchError } = useXoRoleCollection()

const { users, areUsersReady, hasUserFetchError } = useXoUserCollection()

const steps = computed<StepDefinition[]>(() => [
  { label: t('group-details') },
  { label: t('group:roles-assignment') },
  { label: t('group:users-assignment') },
  { label: t('review-and-confirm') },
])

const stepNames = ['details', 'roles', 'users', 'review'] as const

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

.name {
  @media (--medium-or-large) {
    max-width: calc(50% - 1.2rem);
  }
}
</style>
