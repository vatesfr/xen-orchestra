<template>
  <div>
    <img alt="Under construction" src="../assets/under-construction.svg" />
    <p class="title">XOLite is under construction</p>
    <p class="subtitle">New features are coming soon!</p>
    <p class="contact">
      You have needs and/or expectations? Let us know
      <!-- TODO: Add the href  -->
      <a href="#" target="_blank" rel="noopener noreferrer">here →</a>
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

  & img {
    margin-bottom: 40px;
  }
}
img {
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
}
</style>
