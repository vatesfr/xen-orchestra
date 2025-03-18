<template>
  <UiTaskItem :user="data.user" :infos="data.infos" :estimate="data.estimate" :start="data.start" :label="data.label">
    <span class="typo-body-regular">Lorem ipsum dolor sit amet, consectetur adipiscing elit</span>
  </UiTaskItem>
</template>

<script setup lang="ts">
import UiTaskItem from '@core/components/ui/task-item/UiTaskItem.vue'

const data = {
  start: 1742303050,
  estimate: 7260,
  label: 'xo:xostore:create',
  infos: [
    { id: 1, accent: 'info', message: 'info', count: 1 },
    { id: 2, accent: 'warning', message: 'warning', count: 2 },
    { id: 3, accent: 'danger', message: 'error', count: 3 },
  ],
  user: 'Sébastian',
}
</script>
<!-- // Success -->
<!-- { -->
<!-- "id": "0m8eavoye", -->
<!-- "properties": { -->
<!-- "name": "REST: create_vm pool", -->
<!-- "objectId": "b7569d99-30f8-178a-7d94-801de3e29b5b", -->
<!-- "userId": "260f7f80-b257-4c9f-885a-17ef5dbe71a9" -->
<!-- }, -->
<!-- "start": 1742290670102, -->
<!-- "status": "success", -->
<!-- "updatedAt": 1742290672161, -->
<!-- "end": 1742290672161, -->
<!-- "result": "4bf5c1db-dad2-6ded-4c34-a8f43fc24000" -->
<!-- } -->

<!-- Error -->
<!-- { -->
<!-- "id": "0m7vtsw1s", -->
<!-- "properties": { -->
<!-- "name": "REST: create_vm pool", -->
<!-- "objectId": "b7569d99-30f8-178a-7d94-801de3e29b5b", -->
<!-- "userId": "260f7f80-b257-4c9f-885a-17ef5dbe71a9" -->
<!-- }, -->
<!-- "start": 1741173594688, -->
<!-- "status": "failure", -->
<!-- "updatedAt": 1741173603988, -->
<!-- "end": 1741173603988, -->
<!-- "result": { -->
<!-- "message": "no object with UUID or opaque ref: 0cb9edfd-aa75-a8a4-0ec1-5833c7217f98", -->
<!-- "name": "Error", -->
<!-- "stack": "Error: no object with UUID or opaque ref: 0cb9edfd-aa75-a8a4-0ec1-5833c7217f98\n    at Xapi.apply (file:///Users/sebastian/Documents/GitHub/xen-orchestra/packages/xen-api/index.mjs:725:11)\n    at Xapi.getObject (file:///Users/sebastian/Documents/GitHub/xen-orchestra/packages/xo-server/src/xapi/index.mjs:100:26)\n    at map (file:///Users/sebastian/Documents/GitHub/xen-orchestra/packages/xo-server/src/xapi/mixins/vm.mjs:302:29)\n    at Array.map (<anonymous>)\n    at Xapi.createVm (file:///Users/sebastian/Documents/GitHub/xen-orchestra/packages/xo-server/src/xapi/mixins/vm.mjs:294:23)\n    at file:///Users/sebastian/Documents/GitHub/xen-orchestra/packages/xo-server/src/xo-mixins/rest-api.mjs:795:26\n    at Task.runInside (/Users/sebastian/Documents/GitHub/xen-orchestra/@vates/task/index.js:175:22)\n    at Task.run (/Users/sebastian/Documents/GitHub/xen-orchestra/@vates/task/index.js:159:20)" -->
<!-- } -->
<!-- } -->
