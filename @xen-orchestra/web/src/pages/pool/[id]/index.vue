<script lang="ts" setup>
// [DO NOT REMOVE]
// To fix a Vite error during the build process, this comment is required.
// The `definePage` macro is removed during the build, leaving an empty script tag that causes the build to fail.
definePage({
  name: '/pool/:id',
  redirect: (to: any) => `/pool/${to.params.id}/console`,
})
</script>
