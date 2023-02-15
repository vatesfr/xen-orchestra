<template>
  <div>
    <img alt="Under construction" src="../assets/under-construction.svg" />
    <p class="title">{{ $t("xo-lite-under-construction") }}</p>
    <p class="subtitle">{{ $t("new-features-are-coming") }}</p>
    <p class="contact">
      {{ $t("do-you-have-needs") }}
      <!-- TODO: Add the href  -->
      <a href="#" target="_blank" rel="noopener noreferrer">
        {{ $t("here") }}→
      </a>
    </p>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="postcss" scoped>
div {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-extra-blue-base);
}

img {
  margin-bottom: 40px;
  width: 30%;
}
.title {
  font-weight: 400;
  font-size: 36px;
  text-align: center;
}

.subtitle {
  font-weight: 500;
  font-size: 24px;
  margin: 21px 0;
  text-align: center;
}
.contact {
  font-weight: 400;
  font-size: 20px;
  color: var(--color-blue-scale-100);

  & a {
    text-transform: lowercase;
  }
}
</style>
