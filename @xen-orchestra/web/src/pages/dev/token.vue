<template>
  <div class="token">
    <form @submit.prevent="handleSubmit">
      Enter XO 5 token:
      <input v-model="token" />
      <button type="submit">Register token</button>
    </form>

    <button type="button" class="clear-token" @click="clearToken">Clear token</button>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const token = ref('')
const router = useRouter()

const redirect = async () => {
  await router.push('/')
  window.location.reload()
}

const setCookie = (value: string) => {
  document.cookie = `token=${value}; path=/; max-age=31536000`
  redirect()
}

function handleSubmit() {
  setCookie(token.value)
}

function clearToken() {
  setCookie('')
}
</script>

<style lang="postcss" scoped>
.token {
  padding: 2rem;
}

.clear-token {
  margin-top: 2rem;
}
</style>
