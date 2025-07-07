<template>
  <div class="pages-dev-icons">
    <!--    <UiInput v-model="searchTerm" accent="brand" placeholder="Search icon" /> -->
    <UiCard>
      <div class="icons">
        <RouterLink
          v-for="iconItem of iconItems"
          :key="iconItem.id"
          v-tooltip="{ selector: '.text-ellipsis' }"
          :to="{ name: '/dev/icons/[name]', params: { name: iconItem.id } }"
          class="icon-link"
        >
          <NewVtsIcon :name="iconItem.id" class="icon" size="current" />
          <div class="icon-name text-ellipsis">{{ iconItem.id }}</div>
        </RouterLink>
      </div>
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import NewVtsIcon from '@core/components/icon/NewVtsIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { type IconName, icons } from '@core/icons'
import { useCollection } from '@core/packages/collection'

const { items: iconItems } = useCollection(Object.keys(icons) as IconName[])
</script>

<style lang="postcss" scoped>
.pages-dev-icons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  font-size: 4rem;

  --color--icon-1: blue;

  .icons {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
    background-color: var(--color-neutral-background-primary);
    align-items: center;
    justify-content: center;

    .icon-link {
      text-align: center;
      overflow: hidden;
      padding: 1rem 1rem;
      cursor: pointer;
      text-decoration: none;
      color: var(--color-neutral-txt-primary);

      &:hover {
        background-color: var(--color-neutral-background-secondary);
        box-shadow: var(--shadow-300);
        border-radius: 0.5rem;
        z-index: 1;
        transition: all 0.2s ease-in-out;
      }
    }

    .icon-name {
      font-size: 1rem;
      white-space: nowrap;
      font-weight: 400;
    }
  }
}
</style>
