# useMultiSelect composable

```vue
<template>
  <table>
    <thead>
      <tr>
        <th>
          <input type="checkbox" v-model="areAllSelected" />
        </th>
        <th>Name</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in items">
        <td>
          <input type="checkbox" :value="item.id" v-model="selected" />
        </td>
        <td>{{ item.name }}</td>
      </tr>
    </tbody>
  </table>

  <!-- You can use something else than a "Select All" checkbox -->
  <button @click="areAllSelected = !areAllSelected">Toggle all selected</button>
</template>

<script lang="ts" setup>
import useMultiSelect from './multi-select.composable'

const { selected, areAllSelected } = useMultiSelect()
</script>
```
