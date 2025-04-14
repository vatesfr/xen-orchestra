```vue-template
<UiCard>
  <UiCardTitle>My Card</UiCardTitle>
  <VtsLoadingHero v-if="!isReady" type="card" />
  <div v-else>Content of my card</div>
</UiCard>
```
