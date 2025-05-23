<script lang="ts" setup>
definePage({
  name: '/vm/:id',
  redirect: (to: any) => `/vm/${to.params.id}/console`,
})
</script>
