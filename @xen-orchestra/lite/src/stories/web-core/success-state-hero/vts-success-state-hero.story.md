# Usage

The card telling an action succeeded: an optional title, the success alert, then the actions that follow, centred.

```vue-template
<VtsSuccessStateHero>
  <template #title>Connected to 192.168.1.1</template>
  The pool is connected.
  <template #actions>
    <UiLink :to="poolRoute" size="medium">Visit the pool dashboard</UiLink>
  </template>
</VtsSuccessStateHero>
```
