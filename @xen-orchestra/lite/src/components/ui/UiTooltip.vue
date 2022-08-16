<template>
  <div class="ui-tooltip">
    <span class="triangle" />
    <span class="label"><slot /></span>
  </div>
</template>

<script lang="ts" setup></script>

<style lang="postcss" scoped>
.ui-tooltip {
  font-size: 1.6rem;
  font-weight: 400;
  display: inline-flex;
  padding: 0.3125em 0.5em;
  color: var(--color-blue-scale-500);
  border-radius: 0.5em;
  background-color: var(--color-blue-scale-100);
  position: relative;
  margin-bottom: 0.5em;
}

.triangle {
  position: absolute;
  background-color: var(--color-blue-scale-100);
  text-align: left;
  left: calc(50% - 0.3125em);
  bottom: 0.3125em;
  transform: skewX(-30deg) scale(1, 0.866);

  &:before {
    transform: rotate(-135deg) skewX(-45deg) scale(1.414, 0.707)
      translate(0, -50%);
  }

  &:after {
    transform: rotate(135deg) skewY(-45deg) scale(0.707, 1.414) translate(50%);
  }

  &:before,
  &:after {
    content: "";
    position: absolute;
    background-color: inherit;
  }
}

.triangle,
.triangle:before,
.triangle:after {
  width: 1.25em;
  height: 1.25em;
  border-top-right-radius: 30%;
}

.ui-tooltip[data-placement="bottom-center"] .triangle {
  top: 0.3125em;
  bottom: auto;
  transform: rotate(180deg) skewX(-30deg) scale(1, 0.866);
  left: auto;
  right: calc(50% - 0.3125em);
}
</style>
