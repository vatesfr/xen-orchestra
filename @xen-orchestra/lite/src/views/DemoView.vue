<template>
  <div class="foo">
    <select>
      <option></option>
      <option value="foo">Foo</option>
      <option value="foo">Foo</option>
      <option value="foo">Foo</option>
      <option value="foo">Foo</option>
    </select>
  </div>
  <div class="foo">
    <input placeholder="Bar" />
  </div>
</template>

<script lang="ts" setup></script>

<style scoped>
.foo:has(option[value]:checked) {
  border: 1px solid blue;
}
</style>
