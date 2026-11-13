import { type FrontXoGroup, useXoGroupCollection } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import type { NewGroupPayload } from '@/modules/group/types.ts'
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { type Maybe, required, withMessage, withParams } from '@core/packages/form-validation'
import { defineFormSteps, useMultiStepValidatedForm } from '@core/packages/validated-form'
import { useI18n } from 'vue-i18n'

export function useNewGroupForm() {
  const { t } = useI18n()

  const { groups } = useXoGroupCollection()

  const formData = defineFormSteps({
    details: {
      name: '',
    },
    roles: {
      roleIds: [] as FrontXoRole['id'][],
    },
    users: {
      userIds: [] as FrontXoUser['id'][],
    },
    review: {},
  })

  const { useField, currentStep, next, back, backTo, validateAllSteps } = useMultiStepValidatedForm(formData, {
    details: {
      errors: {
        onSubmit: () => ({
          name: {
            required,
            unique: withMessage(
              withParams(
                (name: Maybe<string>, existingGroups: FrontXoGroup[]) =>
                  !existingGroups.some(group => group.name === name),
                [groups]
              ),
              () => t('new-group:error-already-exists.', { name: formData.details.name })
            ),
          },
        }),
      },
    },
    roles: {},
    users: {},
    review: {},
  })

  async function validateAndBuildPayload(): Promise<NewGroupPayload | undefined> {
    if (!(await validateAllSteps())) {
      return undefined
    }

    return {
      group: { name: formData.details.name },
      roleIds: formData.roles.roleIds,
      userIds: formData.users.userIds,
    }
  }

  return {
    formData,
    currentStep,
    next,
    back,
    backTo,
    nameInputBindings: useField('name', () => ({ label: t('name'), required: true })),
    validateAndBuildPayload,
  }
}
