<script lang="ts" setup>
definePage({
  name: '/host/:id',
  redirect: (to: any) => `/host/${to.params.id}/dashboard`,
})
</script>
