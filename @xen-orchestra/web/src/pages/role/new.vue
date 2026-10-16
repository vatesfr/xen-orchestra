<template>
  <UiHeadBar icon="fa:plus">
    {{ t('role:new') }}
  </UiHeadBar>

  <div class="card-container">
    <VtsOperationPendingCard v-if="isCreating" :title="t('role:creating')" />
    <VtsOperationErrorCard v-else-if="error !== undefined" :title="t('role:unable-to-create')" :error>
      <template #actions>
        <UiButton variant="secondary" accent="brand" size="medium" @click="error = undefined">
          {{ t('action:go-back') }}
        </UiButton>
      </template>
    </VtsOperationErrorCard>
    <UiCard v-show="canDisplayForm">
      <NewRoleForm @create="createRole" @cancel="router.push(ROLES_ROUTE)" />
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import NewRoleForm from '@/modules/role/components/form/new/NewRoleForm.vue'
import { useXoRoleCreateJob } from '@/modules/role/jobs/xo-role-create.job.ts'
import { useXoRoleCollection } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import type { NewRolePayload } from '@/modules/role/types.ts'
import type { ApiError } from '@/shared/error/api.error.ts'
import VtsOperationErrorCard from '@core/components/operation-error-card/VtsOperationErrorCard.vue'
import VtsOperationPendingCard from '@core/components/operation-pending-card/VtsOperationPendingCard.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const ROLES_ROUTE = { name: '/admin/user-management/roles' } as const

const { t } = useI18n()

const router = useRouter()

const newRole = ref<NewRolePayload>()

const error = ref<ApiError | Error>()

const { canRun: canCreateRole, run: createRoleJob, isRunning: isCreating } = useXoRoleCreateJob(newRole)

const { $context } = useXoRoleCollection()

const canDisplayForm = computed(() => !isCreating.value && error.value === undefined)

async function createRole(role: NewRolePayload) {
  newRole.value = role

  if (!canCreateRole.value) {
    return
  }

  try {
    await createRoleJob()

    $context.forceReload()

    await router.push(ROLES_ROUTE)
  } catch (_error) {
    error.value = _error as ApiError | Error
  }
}
</script>

<style lang="postcss" scoped>
.card-container {
  padding: 0.8rem;
}
</style>
