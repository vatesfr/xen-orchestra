<template>
  <li class="panel-collapsed-actions">
    <ul ref="target" class="list" />
  </li>
</template>

<script lang="ts" setup>
import { IK_CLOSE_MENU, IK_PANEL_ACTIONS } from '@core/utils/injection-keys.util.ts'
import { inject, useTemplateRef, watchEffect } from 'vue'

const panelActions = inject(IK_PANEL_ACTIONS, undefined)

const closeMenu = inject(IK_CLOSE_MENU, undefined)

const target = useTemplateRef('target')

watchEffect(onCleanup => {
  if (panelActions === undefined || target.value === null) {
    return
  }

  panelActions.menu.value = { target: target.value, close: () => closeMenu?.() }

  onCleanup(() => {
    panelActions.menu.value = undefined
  })
})
</script>

<style lang="postcss" scoped>
.panel-collapsed-actions {
  display: contents;

  .list {
    display: contents;
  }
}
</style>
