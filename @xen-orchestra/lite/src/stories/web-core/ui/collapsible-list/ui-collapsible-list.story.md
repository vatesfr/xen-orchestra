```vue-template
<UiCollapsibleList tag="ul" :total-items="vms.length">
  <li v-for="vm in vms" :key="vm.id">
    <UiLink :icon="faDesktop" size="medium" :to="`/vm/${vm.id}`">
      {{ vm.name_label }}
    </UiLink>
  </li>
</UiCollapsibleList>
```
