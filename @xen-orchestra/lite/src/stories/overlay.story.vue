<template>
  <UiCard class="overlay-story">
    <UiCardTitle>Overlay system demo</UiCardTitle>

    <p class="row">
      VM name: <strong>{{ vmName }}</strong>
    </p>

    <p class="row">
      The button opens a drawer, which opens a rename modal, which opens a confirmation modal. The confirmed name is
      trimmed by the drawer, then propagated back here, where the drawer is kept open with the updated name (reactive
      props).
    </p>

    <div class="row">
      <UiButton accent="brand" size="medium" variant="primary" @click="openDrawer()">Open VM drawer</UiButton>
    </div>

    <div v-if="logs.length > 0" class="logs">
      <UiCardTitle>Responses</UiCardTitle>
      <ul>
        <li v-for="(log, index) of logs" :key="index" class="row">{{ log }}</li>
      </ul>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { KEEP_OVERLAY_OPEN, OVERLAY_ABORT_EVENT } from '@core/packages/overlay/symbols'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { reactiveComputed } from '@vueuse/core'
import { ref } from 'vue'

const vmName = ref('XO Lite VM')

const logs = ref<string[]>([])

function addLog(message: string) {
  logs.value.unshift(message)
}

const { open: openVmDrawer } = useOverlay({
  component: () => import('@/stories/overlay/DemoVmDrawer.vue'),
  events: {
    onDismiss: true,
  },
})

// `reactiveComputed` keeps the drawer in sync when the name changes while it is open
const drawerProps = reactiveComputed(() => ({ name: vmName.value }))

async function openDrawer() {
  const response = await openVmDrawer({
    props: drawerProps,
    events: {
      onRename: newName => {
        vmName.value = newName

        addLog(`onRename → "${newName}" (drawer kept open, showing the new name)`)

        return KEEP_OVERLAY_OPEN
      },
    },
  })

  if (response.event === OVERLAY_ABORT_EVENT) {
    addLog('Drawer aborted (opener disposed or replaced)')

    return
  }

  addLog(`${response.event} → drawer closed`)
}
</script>

<style lang="postcss" scoped>
.overlay-story {
  margin: 1rem;

  .row {
    font-size: 1.6rem;
  }

  .logs {
    margin-block-start: 1.6rem;
  }
}
</style>
