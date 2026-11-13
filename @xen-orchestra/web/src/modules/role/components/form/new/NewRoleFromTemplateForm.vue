<template>
  <NewRoleForm
    v-if="initialRole !== undefined"
    :initial-role
    @create="role => emit('create', role)"
    @cancel="emit('cancel')"
  />
  <VtsStateHero v-else-if="isRoleTemplateMissing" format="card" type="not-found" size="large">
    {{ t('object-not-found', { id: roleTemplateId }) }}
  </VtsStateHero>
  <VtsStateHero v-else-if="hasFetchError" format="card" type="error" size="large">
    {{ t('error-no-data') }}
  </VtsStateHero>
  <VtsStateHero v-else format="card" type="busy" size="large" />
</template>

<script setup lang="ts">
import NewRoleForm from '@/modules/role/components/form/new/NewRoleForm.vue'
import { useXoRolePrivilegesCollection } from '@/modules/role/remote-resources/use-xo-role-privileges-collection.ts'
import {
  type FrontXoRoleTemplate,
  useXoRoleTemplateCollection,
} from '@/modules/role/remote-resources/use-xo-role-template-collection.ts'
import type { NewRolePayload } from '@/modules/role/types.ts'
import { toNewRolePayload } from '@/modules/role/utils/role-template.util.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { logicAnd, logicOr } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { roleTemplateId } = defineProps<{
  roleTemplateId: FrontXoRoleTemplate['id']
}>()

const emit = defineEmits<{
  create: [role: NewRolePayload]
  cancel: []
}>()

const { t } = useI18n()

const { useGetRoleTemplateById, areRoleTemplatesReady, hasRoleTemplateFetchError } = useXoRoleTemplateCollection()

const roleTemplate = useGetRoleTemplateById(() => roleTemplateId)

const isRoleTemplateMissing = logicAnd(areRoleTemplatesReady, () => roleTemplate.value === undefined)

const { privileges, arePrivilegesReady, hasPrivilegeFetchError } = useXoRolePrivilegesCollection(
  { isEnabled: computed(() => roleTemplate.value !== undefined) },
  () => roleTemplateId
)

const hasFetchError = logicOr(hasRoleTemplateFetchError, hasPrivilegeFetchError)

const initialRole = computed(() => {
  if (roleTemplate.value === undefined || !arePrivilegesReady.value) {
    return undefined
  }

  return toNewRolePayload(roleTemplate.value, privileges.value)
})
</script>
