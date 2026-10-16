<template>
  <VtsForm class="new-role-form" @submit="onSubmit()">
    <section class="section">
      <UiTitle>{{ t('role:details') }}</UiTitle>
      <div class="fields">
        <RoleFormTextInput v-bind="nameInputBindings" />
        <RoleFormTextarea v-bind="descriptionInputBindings" />
      </div>
    </section>

    <section class="section">
      <UiTitle>
        {{ t('privileges') }}

        <template #action>
          <UiButton left-icon="fa:plus" variant="tertiary" accent="brand" size="medium" @click="addPrivileges()">
            {{ t('new') }}
          </UiButton>
        </template>
      </UiTitle>
      <NewRolePrivilegesTable :privileges @edit="editPrivilege" @remove="removePrivilege" />
    </section>

    <div class="buttons">
      <UiButton variant="tertiary" accent="danger" size="medium" @click="emit('cancel')">
        {{ t('cancel') }}
      </UiButton>

      <UiButton type="submit" variant="primary" accent="brand" size="medium">
        {{ t('action:create') }}
      </UiButton>
    </div>
  </VtsForm>
</template>

<script setup lang="ts">
import RoleFormTextarea from '@/modules/role/components/form/inputs/RoleFormTextarea.vue'
import RoleFormTextInput from '@/modules/role/components/form/inputs/RoleFormTextInput.vue'
import NewRolePrivilegesTable from '@/modules/role/components/form/new/NewRolePrivilegesTable.vue'
import { useNewRolePrivileges } from '@/modules/role/composables/use-new-role-privileges.composable.ts'
import { useNewRoleForm } from '@/modules/role/form/new/use-new-role-form.ts'
import type { NewRolePayload } from '@/modules/role/types.ts'
import VtsForm from '@core/components/form/VtsForm.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { objectOmit } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  create: [role: NewRolePayload]
  cancel: []
}>()

const { t } = useI18n()

const { nameInputBindings, descriptionInputBindings, validateAndBuildPayload } = useNewRoleForm()

const { privileges, addPrivileges, editPrivilege, removePrivilege } = useNewRolePrivileges()

async function onSubmit() {
  const role = await validateAndBuildPayload()

  if (role === undefined) {
    return
  }

  emit('create', {
    ...role,
    privileges: privileges.value.map(privilege => objectOmit(privilege, ['key'])),
  })
}
</script>

<style lang="postcss" scoped>
.new-role-form {
  display: flex;
  flex-direction: column;
  gap: 4rem;

  .section {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
  }

  .fields {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
    max-width: 78rem;

    @media (--medium-or-large) {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      align-items: start;
    }
  }

  .buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2.4rem;
  }
}
</style>
