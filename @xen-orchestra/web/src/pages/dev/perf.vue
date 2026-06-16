<template>
  <div :class="$style.page">
    <h1>Data-fetching performance harness</h1>

    <p>
      Start the app with
      <code>XO_MOCK=1 VITE_XO_PERF=1 yarn dev</code>
      to load the generated fixture and record measures. Scale is configurable with
      <code>XO_MOCK_VMS</code>, <code>XO_MOCK_HOSTS</code>, <code>XO_MOCK_POOLS</code> and
      <code>XO_MOCK_VBDS_PER_VM</code>.
    </p>

    <div :class="$style.actions">
      <button type="button" @click="reloadAll">Reload collections</button>
      <button type="button" @click="clear">Clear measures</button>
      <button type="button" @click="computeEnhanced = !computeEnhanced">
        {{ computeEnhanced ? 'Stop' : 'Compute' }} enhanced VM data
      </button>
    </div>

    <p>
      Switching ingestion reloads the worker-eligible collections so you can compare the two paths. Worker mode records
      <code>worker-ingest:*</code> measures; main-thread mode records <code>parse:*</code> measures. The choice persists
      across reloads.
    </p>

    <p>
      Enhanced VM data (RAM/disk/IP for filtering) is computed only on demand: it still runs an O(VMs × VBDs) join on
      the main thread and will freeze the tab at large scale. That hotspot is deferred to a later phase — leave it off
      to validate that ingestion no longer freezes.
    </p>

    <h2>Collections</h2>
    <table :class="$style.table">
      <thead>
        <tr>
          <th>Collection</th>
          <th>Loaded</th>
          <th>Ready</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="collection in collections" :key="collection.label">
          <td>{{ collection.label }}</td>
          <td>{{ collection.count }}</td>
          <td>{{ collection.ready ? 'yes' : 'loading…' }}</td>
        </tr>
      </tbody>
    </table>

    <h2>Measures</h2>
    <table :class="$style.table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Count</th>
          <th>Last (ms)</th>
          <th>Max (ms)</th>
          <th>Total (ms)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in measures" :key="row.name">
          <td>{{ row.name }}</td>
          <td>{{ row.count }}</td>
          <td>{{ formatMs(row.lastMs) }}</td>
          <td>{{ formatMs(row.maxMs) }}</td>
          <td>{{ formatMs(row.totalMs) }}</td>
        </tr>
        <tr v-if="measures.length === 0">
          <td colspan="5">No measure recorded yet — start with VITE_XO_PERF=1.</td>
        </tr>
      </tbody>
    </table>

    <h2>Main thread</h2>
    <ul>
      <li>Long tasks (&gt; 50 ms): {{ longTaskCount }}</li>
      <li>Longest long task: {{ longestLongTask }} ms</li>
      <li>Total blocking time: {{ totalBlocking }} ms</li>
      <li>JS heap used: {{ heapUsedMb ?? 'n/a' }} MB</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useVmEnhancedData } from '@/modules/vm/composables/use-vm-enhanced-data.composable.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoPerfReport } from '@/pages/dev/use-xo-perf-report.ts'
import { computed, ref } from 'vue'

const { pools, arePoolsReady, $context: poolContext } = useXoPoolCollection()
const { hosts, areHostsReady, $context: hostContext } = useXoHostCollection()
const { vms, areVmsReady, $context: vmContext } = useXoVmCollection()
const { vbds, areVbdsReady, $context: vbdContext } = useXoVbdCollection()
const { vdis, areVdisReady, $context: vdiContext } = useXoVdiCollection()

const { filterableVms } = useVmEnhancedData(() => vms.value)

const { measures, longTaskCount, longestLongTaskMs, totalBlockingMs, heapUsedMb, clear } = useXoPerfReport()

const computeEnhanced = ref(false)

const collections = computed(() => {
  const rows = [
    { label: 'Pools', count: pools.value.length, ready: arePoolsReady.value },
    { label: 'Hosts', count: hosts.value.length, ready: areHostsReady.value },
    { label: 'VMs', count: vms.value.length, ready: areVmsReady.value },
    { label: 'VBDs', count: vbds.value.length, ready: areVbdsReady.value },
    { label: 'VDIs', count: vdis.value.length, ready: areVdisReady.value },
  ]

  if (computeEnhanced.value) {
    rows.push({ label: 'Enhanced VMs', count: filterableVms.value.length, ready: areVmsReady.value })
  }

  return rows
})

const longestLongTask = computed(() => Math.round(longestLongTaskMs.value))

const totalBlocking = computed(() => Math.round(totalBlockingMs.value))

function reloadAll() {
  poolContext.forceReload()
  hostContext.forceReload()
  vmContext.forceReload()
  vbdContext.forceReload()
  vdiContext.forceReload()
}

function formatMs(ms: number) {
  return ms.toFixed(1)
}
</script>

<style module lang="postcss">
.page {
  padding: 1rem;
  font-family: monospace;
}

.actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-block: 1rem;
}

.control {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.table {
  border-collapse: collapse;
  margin-block-end: 1rem;

  & th,
  & td {
    padding: 0.25rem 0.75rem;
    border: 1px solid currentcolor;
    text-align: left;
  }
}
</style>
