<template>
  <GroupDetailLayout :group>
    <GroupDetailsCard :group />
  </GroupDetailLayout>
</template>

<script lang="ts" setup>
import GroupDetailLayout from '@/modules/group/components/detail/GroupDetailLayout.vue'
import GroupDetailsCard from '@/modules/group/components/detail/GroupDetailsCard.vue'
import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'

defineProps<{
  group: FrontXoGroup
}>()
</script>
