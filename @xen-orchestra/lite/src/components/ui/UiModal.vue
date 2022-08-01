<template>
  <Teleport to="body">
    <div class="ui-modal">
      <div class="content">
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup></script>

<style lang="postcss" scoped>
.ui-modal {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #00000080;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content {
  background-color: var(--background-color-primary);
  min-width: 40rem;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: var(--shadow-400);
}

:slotted(.ui-button-group) {
  justify-content: center;
  margin-top: 1rem;
}
</style>
