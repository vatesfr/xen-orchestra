<script lang="ts" setup>
definePage({
  name: '/pool/:id',
  redirect: (to: any) => `/pool/${to.params.id}/hosts`,
})
</script>
