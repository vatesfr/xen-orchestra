# useFilteredCollection composable

```vue
<script lang="ts" setup>
import useFilteredCollection from "./filtered-collection.composable";

const players = [
  { name: "Foo", team: "Blue" },
  { name: "Bar", team: "Red" },
  { name: "Baz", team: "Blue" },
];

const bluePlayers = useFilteredCollection(
  players,
  (player) => player.team === "Blue"
);
</script>
```
