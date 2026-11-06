import { type FrontXoGroup, useXoGroupCollection } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import type { NewUserPayload } from '@/modules/user/types.ts'
import { required, sameAs, withMessage } from '@core/packages/form-validation'
import { defineFormSteps, useMultiStepValidatedForm } from '@core/packages/validated-form'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function getInheritedRoleIds(groups: FrontXoGroup[]): FrontXoRole['id'][] {
  return Array.from(new Set(groups.flatMap(group => group.aclRoleIds)))
}

export function useNewUserForm() {
  const { t } = useI18n()

  const formData = defineFormSteps({
    details: {
      username: '',
      firstname: '',
      lastname: '',
      email: '',
      password: '',
      passwordConfirmation: '',
    },
    groups: {
      groupIds: [] as FrontXoGroup['id'][],
    },
    roles: {
      roleIds: [] as FrontXoRole['id'][],
    },
    review: {},
  })

  const { useField, currentStep, next, back, backTo, validateAllSteps } = useMultiStepValidatedForm(formData, {
    details: {
      errors: {
        onSubmit: () => ({
          username: { required },
          firstname: { required },
          lastname: { required },
          email: { required },
          password: { required },
          passwordConfirmation: {
            required,
            sameAs: withMessage(
              sameAs(() => formData.details.password),
              () => t('form:error:password-mismatch')
            ),
          },
        }),
      },
    },
    groups: {},
    roles: {},
    review: {},
  })

  const { useGetGroupsByIds } = useXoGroupCollection()

  const selectedGroups = useGetGroupsByIds(() => formData.groups.groupIds)

  const inheritedRoleIds = computed(() => getInheritedRoleIds(selectedGroups.value))

  const directRoleIds = computed(() =>
    formData.roles.roleIds.filter(roleId => !inheritedRoleIds.value.includes(roleId))
  )

  async function validateAndBuildPayload(): Promise<NewUserPayload | undefined> {
    if (!(await validateAllSteps())) {
      return undefined
    }

    const { username, firstname, lastname, email, password } = formData.details

    return {
      user: {
        name: email.trim(),
        username: username.trim(),
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        password,
      },
      groupIds: formData.groups.groupIds,
      roleIds: directRoleIds.value,
    }
  }

  return {
    formData,
    selectedGroups,
    inheritedRoleIds,
    directRoleIds,
    currentStep,
    next,
    back,
    backTo,
    usernameInputBindings: useField('username', () => ({ label: t('username'), required: true })),
    firstnameInputBindings: useField('firstname', () => ({ label: t('first-name'), required: true })),
    lastnameInputBindings: useField('lastname', () => ({ label: t('last-name'), required: true })),
    emailInputBindings: useField('email', () => ({ label: t('email-address'), required: true })),
    passwordInputBindings: useField('password', () => ({
      label: t('password'),
      type: 'password' as const,
      required: true,
    })),
    passwordConfirmationInputBindings: useField('passwordConfirmation', () => ({
      label: t('password-confirmation'),
      type: 'password' as const,
      required: true,
    })),
    validateAndBuildPayload,
  }
}
