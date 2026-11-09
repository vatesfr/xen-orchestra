<template>
  <PrivilegeDetailLayout :privilege>
    <div class="cards">
      <PrivilegeScopeDetailsCard :privilege />
      <PrivilegeScopeObjectsCard v-if="selectableResource !== undefined" :privilege :resource="selectableResource" />
    </div>
  </PrivilegeDetailLayout>
</template>

<script lang="ts" setup>
import PrivilegeDetailLayout from '@/modules/role/components/privilege/detail/PrivilegeDetailLayout.vue'
import PrivilegeScopeDetailsCard from '@/modules/role/components/privilege/detail/PrivilegeScopeDetailsCard.vue'
import PrivilegeScopeObjectsCard from '@/modules/role/components/privilege/detail/PrivilegeScopeObjectsCard.vue'
import { isSelectablePrivilegeResource } from '@/modules/role/utils/privilege-catalogue.util.ts'
import type { XoAclBasePrivilege } from '@vates/types'
import { computed } from 'vue'

const { privilege } = defineProps<{
  privilege: XoAclBasePrivilege
}>()

const selectableResource = computed(() =>
  isSelectablePrivilegeResource(privilege.resource) ? privilege.resource : undefined
)
</script>

<style lang="postcss" scoped>
.cards {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
