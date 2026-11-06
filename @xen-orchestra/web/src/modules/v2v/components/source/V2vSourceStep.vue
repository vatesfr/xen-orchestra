<template>
  <div class="v2v-source-step">
    <V2vRememberedConnectionsCard>
      <V2vRememberedConnectionList
        :connections="rememberedConnections"
        :disabled="!canConnect || isConnecting"
        @connect="connection => connectRememberedConnection(connection)"
        @edit="connection => editRemembered(connection)"
        @forget="connection => forgetRemembered(connection)"
        @forget-password="connection => forgetRememberedPassword(connection)"
      />
    </V2vRememberedConnectionsCard>
    <V2vSourceConnectionForm
      ref="connectionForm"
      :form
      :prerequisite
      :can-connect
      :is-connecting
      :connection-error
      @submit="submit()"
      @cancel="cancel()"
    />
  </div>
</template>

<script lang="ts" setup>
import V2vRememberedConnectionList from '@/modules/v2v/components/source/V2vRememberedConnectionList.vue'
import V2vRememberedConnectionsCard from '@/modules/v2v/components/source/V2vRememberedConnectionsCard.vue'
import V2vSourceConnectionForm from '@/modules/v2v/components/source/V2vSourceConnectionForm.vue'
import { useV2vSourceStep } from '@/modules/v2v/composables/use-v2v-source-step.composable.ts'
import type { V2vRememberedConnection } from '@/modules/v2v/types/v2v-remembered-connection.type.ts'
import { useTemplateRef } from 'vue'

const connectionForm = useTemplateRef('connectionForm')

const {
  form,
  rememberedConnections,
  prerequisite,
  canConnect,
  isConnecting,
  connectionError,
  submit,
  connectRemembered,
  editRemembered,
  forgetRemembered,
  forgetRememberedPassword,
  cancel,
} = useV2vSourceStep()

async function connectRememberedConnection(connection: V2vRememberedConnection) {
  const { isPasswordRequired } = await connectRemembered(connection)

  if (isPasswordRequired) {
    connectionForm.value?.focusPassword()
  }
}
</script>

<style lang="postcss" scoped>
.v2v-source-step {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(38rem, 1fr));
  align-items: start;
  gap: 1.6rem;
}
</style>
