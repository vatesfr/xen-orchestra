<template>
  <div class="page-dev-icons-name">
    <UiLink :to="{ name: '/dev/icons/' }" :icon="faAngleLeft" size="medium">Back to all icons</UiLink>
    <UiCard>
      <div class="sizes">
        <div v-for="size of ['small', 'medium', 'large'] as const" :key="size" class="size">
          <NewVtsIcon :name="route.params.name as IconName" :size />
          <div>{{ size }}</div>
        </div>
      </div>
      <div class="big">
        <NewVtsIcon :name="route.params.name as IconName" size="current" />
        <div class="icon-name">{{ route.params.name }}</div>
      </div>
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import type { IconName } from '@core/icons'
import NewVtsIcon from '@core/components/icon/NewVtsIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons'
import { useRoute } from 'vue-router'

const route = useRoute('/dev/icons/[name]')
</script>

<style lang="postcss" scoped>
.page-dev-icons-name {
  padding: 1rem;

  .sizes {
    display: flex;
    justify-content: space-around;

    .size {
      text-align: center;
    }
  }

  .big {
    margin-top: 5rem;
    text-align: center;
    font-size: 20rem;

    .icon-name {
      font-size: 4rem;
    }
  }
}
</style>
