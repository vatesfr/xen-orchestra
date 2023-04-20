<template>
  <div class="no-data">
    <img alt="No data" class="img" src="@/assets/undraw-bug-fixing.svg" />
    <p class="text-error">{{ $t("error-no-data") }}</p>
  </div>
</template>

<style scoped lang="postcss">
.no-data {
  text-align: center;
}

.img {
  display: block;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 1em;
  width: 17em;
  height: 13em;
}
.text-error {
  margin: auto;
  width: 8em;
  font-style: normal;
  font-weight: 500;
  font-size: 1.25em;
  line-height: 150%;
  color: var(--color-red-vates-base);
}
</style>
