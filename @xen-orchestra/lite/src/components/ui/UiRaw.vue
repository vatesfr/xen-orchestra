<template>
  <pre class="ui-raw"><slot /></pre>
</template>

<style lang="postcss" scoped>
.ui-raw {
  background-color: var(--color-neutral-border);
  text-align: left;
  overflow: auto;
  max-width: 100%;
  width: 48em;
  padding: 0.5em;
  border-radius: 8px;
  line-height: 150%;
}
</style>
