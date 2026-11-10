<template>
  <ul v-if="connections.length > 0" class="v2v-remembered-connection-list">
    <V2vRememberedConnectionItem
      v-for="connection of connections"
      :key="getRememberedConnectionKey(connection)"
      :connection
      :disabled
      @connect="connection => emit('connect', connection)"
      @edit="connection => emit('edit', connection)"
      @forget="connection => emit('forget', connection)"
      @forget-password="connection => emit('forgetPassword', connection)"
    />
  </ul>
  <VtsStateHero v-else format="card" type="no-data" size="small">
    {{ t('no-remembered-connection') }}
  </VtsStateHero>
</template>

<script lang="ts" setup>
import V2vRememberedConnectionItem from '@/modules/v2v/components/source/V2vRememberedConnectionItem.vue'
import type { V2vRememberedConnection } from '@/modules/v2v/types/v2v-remembered-connection.type.ts'
import { getRememberedConnectionKey } from '@/modules/v2v/utils/v2v-remembered-connection.util.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  connections: V2vRememberedConnection[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  connect: [connection: V2vRememberedConnection]
  edit: [connection: V2vRememberedConnection]
  forget: [connection: V2vRememberedConnection]
  forgetPassword: [connection: V2vRememberedConnection]
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.v2v-remembered-connection-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin: 0;
  padding: 0;
}
</style>
