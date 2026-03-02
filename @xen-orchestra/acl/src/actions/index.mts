import { default as alarm } from './alarm.mjs'
import { default as backupArchive } from './backup-archive.mjs'
import { default as backupJob } from './backup-job.mjs'
import { default as backupLog } from './backup-log.mjs'
import { default as backupRepository } from './backup-repository.mjs'
import { default as gpuGroup } from './gpuGroup.mjs'
import { default as group } from './group.mjs'
import { default as host } from './host.mjs'
import { default as message } from './message.mjs'
import { default as network } from './network.mjs'
import { default as pbd } from './pbd.mjs'
import { default as pci } from './pci.mjs'
import { default as pgpu } from './pgpu.mjs'
import { default as pif } from './pif.mjs'
import { default as pool } from './pool.mjs'
import { default as proxy } from './proxy.mjs'
import { default as restoreLog } from './restore-log.mjs'
import { default as schedule } from './schedule.mjs'
import { default as server } from './server.mjs'
import { default as sm } from './sm.mjs'
import { default as sr } from './sr.mjs'
import { default as task } from './task.mjs'
import { default as user } from './user.mjs'
import { default as vbd } from './vbd.mjs'
import { default as vdiSnapshot } from './vdi-snapshot.mjs'
import { default as vdiUnmanaged } from './vdi-unmanaged.mjs'
import { default as vdi } from './vdi.mjs'
import { default as vgpu } from './vgpu.mjs'
import { default as vgpuType } from './vgpuType.mjs'
import { default as vif } from './vif.mjs'
import { default as vmController } from './vm-controller.mjs'
import { default as vmSnapshot } from './vm-snapshot.mjs'
import { default as vmTemplate } from './vm-template.mjs'
import { default as vm } from './vm.mjs'
import { default as vtpm } from './vtpm.mjs'

/**
 * value without sub action like 'shutdown' mean: 'shutdown:*' (so shutdown mean you can shutdown:clean and shutdown:hard)
 */
export const SUPPORTED_ACTIONS_BY_RESOURCE = {
  alarm,
  'backup-archive': backupArchive,
  'backup-job': backupJob,
  'backup-log': backupLog,
  'backup-repository': backupRepository,
  group,
  gpuGroup,
  host,
  message,
  network,
  pbd,
  pci,
  pgpu,
  pif,
  pool,
  proxy,
  'restore-log': restoreLog,
  schedule,
  server,
  sm,
  sr,
  task,
  user,
  vbd,
  'vdi-snapshot': vdiSnapshot,
  'vdi-unmanaged': vdiUnmanaged,
  vdi,
  vgpu,
  vgpuType,
  vif,
  'vm-controller': vmController,
  'vm-snapshot': vmSnapshot,
  'vm-template': vmTemplate,
  vm,
  vtpm,
} as const
