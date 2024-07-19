<script lang="ts" setup>
// eslint-disable-next-line no-undef
definePage({
  name: '/pool/:id',
  redirect: (to: any) => `/pool/${to.params.id}/hosts`,
})
</script>
