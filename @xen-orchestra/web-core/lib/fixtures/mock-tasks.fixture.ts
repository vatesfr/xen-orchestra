import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'

const VM_ID = 'fc6e6c35-00e7-0edb-4f3b-cb23460c12fa'
const HOST_ID = '84e555d8-267a-4720-aa5f-fd19035aadae'
const POOL_ID = 'b7569d99-30f8-178a-7d94-801de3e29b5b'

const vmDashboard = (id: string) => `/vm/${id}/dashboard`
const hostDashboard = (id: string) => `/host/${id}/dashboard`
const poolDashboard = (id: string) => `/pool/${id}/dashboard`

export const mockTasks: Task[] = [
  // pending — plain name, no progress (defaults to 0), start only
  {
    id: '1',
    name: 'VM backup',
    status: 'pending',
    start: Date.now() - 1000 * 60 * 2,
    tag: 'backup',
    userName: 'admin@xo.io',
  },
  // pending — progress + 2-level subtasks + infos
  {
    id: '2',
    name: 'Full backup job',
    status: 'pending',
    progress: 25,
    start: Date.now() - 1000 * 60 * 45,
    tag: 'backup',
    userName: 'operator@xo.io',
    infos: [{ data: { vms: 12 }, message: 'Processing VMs' }],
    subtasks: [
      {
        id: '2-1',
        name: 'Snapshot',
        status: 'success',
        progress: 100,
        end: Date.now() - 1000 * 60 * 40,
      },
      {
        id: '2-2',
        name: 'Export',
        status: 'pending',
        progress: 10,
        start: Date.now() - 1000 * 60 * 35,
        subtasks: [
          {
            id: '2-2-1',
            name: 'Upload chunk 3/10',
            status: 'pending',
            progress: 5,
            start: Date.now() - 1000 * 60 * 30,
          },
        ],
      },
    ],
  },
  // pending — nameParts with VM link
  {
    id: '3',
    nameParts: [
      { text: 'Backup ' },
      {
        text: 'prod-web-01',
        to: vmDashboard(VM_ID),
      },
    ],
    status: 'pending',
    progress: 60,
    start: Date.now() - 1000 * 60 * 10,
    tag: 'backup',
  },
  // pending — nameParts with host link + warnings
  {
    id: '4',
    nameParts: [
      { text: 'Migrate VM to ' },
      {
        text: 'xcp-host-02',
        to: hostDashboard(HOST_ID),
      },
    ],
    status: 'pending',
    progress: 15,
    start: Date.now() - 1000 * 60 * 20,
    tag: 'migration',
    warnings: [{ data: { retry: 1 }, message: 'Network latency detected' }],
  },
  // pending — high progress, no end
  {
    id: '5',
    name: 'Storage scan',
    status: 'pending',
    progress: 92,
    start: Date.now() - 1000 * 60 * 60,
    infos: [{ data: null, message: 'Scanning orphaned VDI' }],
  },
  // pending — infos + warnings together
  {
    id: '6',
    name: 'Rolling pool update',
    status: 'pending',
    progress: 50,
    start: Date.now() - 1000 * 60 * 60 * 3,
    infos: [{ data: { hosts: 4, done: 2 }, message: 'Hosts updated' }],
    warnings: [{ data: { host: 'host-3' }, message: 'Reboot required after update' }],
    subtasks: [
      { id: '6-1', name: 'host-1', status: 'success', progress: 100, end: Date.now() - 1000 * 60 * 60 * 2 },
      { id: '6-2', name: 'host-2', status: 'success', progress: 100, end: Date.now() - 1000 * 60 * 60 },
      { id: '6-3', name: 'host-3', status: 'pending', progress: 30, start: Date.now() - 1000 * 60 * 15 },
    ],
  },
  // success — plain name, end only
  {
    id: '7',
    name: 'Final task',
    status: 'success',
    progress: 100,
    end: Date.now() - 1000 * 60 * 15,
    warnings: [{ data: { file: 'server-1.log' }, message: 'Minor warning in log' }],
  },
  // success — nameParts with pool link
  {
    id: '8',
    nameParts: [
      { text: 'Pool ' },
      {
        text: 'Production',
        to: poolDashboard(POOL_ID),
      },
      { text: ' health check' },
    ],
    status: 'success',
    progress: 100,
    end: Date.now() - 1000 * 60 * 60 * 2,
    tag: 'health-check',
    userName: 'admin@xo.io',
  },
  // success — nameParts with SR (no link)
  {
    id: '9',
    nameParts: [{ text: 'VDI compact on ' }, { text: 'local-storage' }],
    status: 'success',
    progress: 100,
    end: Date.now() - 1000 * 60 * 60 * 6,
    infos: [{ data: { reclaimed: '42 GiB' }, message: 'Space reclaimed' }],
  },
  // success — nested subtasks all completed
  {
    id: '10',
    name: 'Restore from backup',
    status: 'success',
    progress: 100,
    start: Date.now() - 1000 * 60 * 60 * 5,
    end: Date.now() - 1000 * 60 * 60 * 4,
    subtasks: [
      {
        id: '10-1',
        name: 'Import VDI',
        status: 'success',
        progress: 100,
        end: Date.now() - 1000 * 60 * 60 * 4.5,
        subtasks: [
          {
            id: '10-1-1',
            name: 'Verify checksum',
            status: 'success',
            progress: 100,
            end: Date.now() - 1000 * 60 * 60 * 4.6,
          },
        ],
      },
      { id: '10-2', name: 'Start VM', status: 'success', progress: 100, end: Date.now() - 1000 * 60 * 60 * 4 },
    ],
  },
  // success — old end date
  {
    id: '11',
    name: 'VM backup',
    status: 'success',
    progress: 100,
    end: Date.now() - 1000 * 60 * 60 * 24 * 4,
    subtasks: [
      { id: '11-1', name: 'Snapshot', status: 'success', progress: 100, end: Date.now() - 1000 * 60 * 60 * 24 * 4 },
    ],
  },
  // success — minimal fields
  {
    id: '12',
    name: 'Quick sync',
    status: 'success',
    end: Date.now() - 1000 * 60 * 5,
  },
  // failure — plain name, warnings, end
  {
    id: '13',
    name: 'VM Migration',
    status: 'failure',
    progress: 100,
    end: Date.now() - 1000 * 60 * 60,
    warnings: [{ data: { file: 'migration.log' }, message: 'Migration aborted' }],
  },
  // failure — nameParts, no end
  {
    id: '14',
    nameParts: [
      { text: 'Export ' },
      { text: 'db-server', to: vmDashboard('44444444-4444-4444-4444-444444444444') },
      { text: ' to NFS' },
    ],
    status: 'failure',
    progress: 73,
    start: Date.now() - 1000 * 60 * 60 * 2,
    tag: 'export',
  },
  // failure — nested subtasks with mixed results
  {
    id: '15',
    name: 'Disaster recovery drill',
    status: 'failure',
    progress: 100,
    start: Date.now() - 1000 * 60 * 60 * 8,
    end: Date.now() - 1000 * 60 * 60 * 7,
    subtasks: [
      { id: '15-1', name: 'Provision VM', status: 'success', progress: 100, end: Date.now() - 1000 * 60 * 60 * 7.5 },
      {
        id: '15-2',
        name: 'Restore data',
        status: 'failure',
        progress: 100,
        end: Date.now() - 1000 * 60 * 60 * 7,
        warnings: [{ data: { missing: 3 }, message: 'Missing backup files' }],
        subtasks: [
          { id: '15-2-1', name: 'Mount SR', status: 'failure', progress: 100, end: Date.now() - 1000 * 60 * 60 * 7.1 },
        ],
      },
    ],
  },
  // interrupted — start + low progress + infos
  {
    id: '16',
    name: 'Storage Migration',
    status: 'interrupted',
    progress: 10,
    start: Date.now() - 1000 * 60 * 60 * 2,
    infos: [
      { data: { rows: 1200 }, message: 'Rows migrated before interruption' },
      { data: null, message: 'Task manually aborted' },
    ],
  },
  // interrupted — warnings + infos + nameParts
  {
    id: '17',
    nameParts: [{ text: 'Copy VM to ' }, { text: 'DR-pool', to: poolDashboard(POOL_ID) }],
    status: 'interrupted',
    progress: 45,
    start: Date.now() - 1000 * 60 * 60 * 5,
    end: Date.now() - 1000 * 60 * 60 * 4,
    warnings: [{ data: { reason: 'user' }, message: 'Aborted by user' }],
    infos: [{ data: { copied: '18 GiB' }, message: 'Partial copy completed' }],
  },
  // pending — progress 100 but still running (edge case)
  {
    id: '18',
    name: 'Finalize export',
    status: 'pending',
    progress: 100,
    start: Date.now() - 1000 * 60,
    infos: [{ data: null, message: 'Waiting for cleanup' }],
  },
  // pending — multiple nameParts links
  {
    id: '19',
    nameParts: [
      { text: 'Move ' },
      { text: 'web-vm', to: vmDashboard(VM_ID) },
      { text: ' from ' },
      { text: 'pool-a', to: poolDashboard(POOL_ID) },
      { text: ' to ' },
      { text: 'pool-b', to: poolDashboard(POOL_ID) },
    ],
    status: 'pending',
    progress: 35,
    start: Date.now() - 1000 * 60 * 50,
    tag: 'migration',
    userName: 'devops@xo.io',
  },
  // success — multiple infos
  {
    id: '20',
    name: 'Metadata export',
    status: 'success',
    progress: 100,
    start: Date.now() - 1000 * 60 * 60 * 12,
    end: Date.now() - 1000 * 60 * 60 * 11,
    infos: [
      { data: { records: 8542 }, message: 'Records exported' },
      { data: { format: 'json' }, message: 'Export format' },
      { data: null, message: 'Export verified' },
    ],
  },
  // failure — multiple warnings, no progress
  {
    id: '21',
    name: 'Certificate renewal',
    status: 'failure',
    end: Date.now() - 1000 * 60 * 60 * 24,
    warnings: [
      { data: { host: 'host-1' }, message: 'Certificate expired' },
      { data: { host: 'host-2' }, message: 'Connection refused' },
    ],
  },
  // pending — single subtask, no nesting
  {
    id: '22',
    name: 'Plugin update',
    status: 'pending',
    progress: 70,
    start: Date.now() - 1000 * 60 * 8,
    tag: 'plugin',
    subtasks: [
      { id: '22-1', name: 'Download package', status: 'success', progress: 100, end: Date.now() - 1000 * 60 * 7 },
    ],
  },
  // success — name only via nameParts (text segments)
  {
    id: '23',
    nameParts: [{ text: 'Scheduled cleanup — no linked objects' }],
    status: 'success',
    progress: 100,
    end: Date.now() - 1000 * 60 * 60 * 24,
  },
  // interrupted — no progress defined (defaults to 100 for non-pending-without-end)
  {
    id: '24',
    name: 'Batch VM start',
    status: 'interrupted',
    start: Date.now() - 1000 * 60 * 60 * 6,
    end: Date.now() - 1000 * 60 * 60 * 5,
    subtasks: [
      { id: '24-1', name: 'vm-a', status: 'success', progress: 100, end: Date.now() - 1000 * 60 * 60 * 5.5 },
      { id: '24-2', name: 'vm-b', status: 'interrupted', progress: 100, end: Date.now() - 1000 * 60 * 60 * 5 },
      { id: '24-3', name: 'vm-c', status: 'pending', progress: 0, start: Date.now() - 1000 * 60 * 60 * 5 },
    ],
  },
  // pending — long plain name
  {
    id: '25',
    name: 'Very long task name that should wrap gracefully in the task list UI when space is limited',
    status: 'pending',
    progress: 8,
    start: Date.now() - 1000 * 60 * 120,
  },
  // success — warnings only on subtask
  {
    id: '26',
    name: 'Patch installation',
    status: 'success',
    progress: 100,
    end: Date.now() - 1000 * 60 * 30,
    subtasks: [
      {
        id: '26-1',
        name: 'Apply hotfix',
        status: 'success',
        progress: 100,
        end: Date.now() - 1000 * 60 * 32,
        warnings: [{ data: { reboot: true }, message: 'Reboot recommended' }],
      },
    ],
  },
  // failure — infos on failure task
  {
    id: '27',
    name: 'Snapshot merge',
    status: 'failure',
    progress: 100,
    start: Date.now() - 1000 * 60 * 60 * 3,
    end: Date.now() - 1000 * 60 * 60 * 2,
    infos: [{ data: { snapshot: 'snap-001' }, message: 'Snapshot locked' }],
    warnings: [{ data: null, message: 'VDI in use' }],
  },
  // pending — zero progress explicit
  {
    id: '28',
    name: 'Queued replication',
    status: 'pending',
    progress: 0,
    start: Date.now() - 1000 * 60 * 3,
    tag: 'replication',
    userName: 'replication-bot',
  },
  // success — start and end both set
  {
    id: '29',
    name: 'ACL sync',
    status: 'success',
    progress: 100,
    start: Date.now() - 1000 * 60 * 60,
    end: Date.now() - 1000 * 60 * 55,
    tag: 'acl',
  },
  // pending — deep subtasks with infos at each level
  {
    id: '30',
    name: 'Full infrastructure backup',
    status: 'pending',
    progress: 18,
    start: Date.now() - 1000 * 60 * 60 * 4,
    tag: 'backup',
    userName: 'admin@xo.io',
    infos: [{ data: { pools: 2 }, message: 'Backup in progress' }],
    subtasks: [
      {
        id: '30-1',
        name: 'Pool 1',
        status: 'pending',
        progress: 40,
        start: Date.now() - 1000 * 60 * 60 * 3,
        infos: [{ data: { vms: 8 }, message: 'VMs to backup' }],
        subtasks: [
          {
            id: '30-1-1',
            name: 'vm-critical',
            status: 'pending',
            progress: 55,
            start: Date.now() - 1000 * 60 * 60 * 2,
            warnings: [{ data: { quiesce: false }, message: 'Quiesced snapshot skipped' }],
          },
        ],
      },
      { id: '30-2', name: 'Pool 2', status: 'success', progress: 100, end: Date.now() - 1000 * 60 * 60 * 2 },
    ],
  },
]
