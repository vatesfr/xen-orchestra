import { createLogger } from '@xen-orchestra/log'
import assert from 'node:assert'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const log = createLogger('xo:qa-test:vm-churn')
const execFileAsync = promisify(execFile)

// AES-CTR keystream from a small urandom seed: faster than /dev/urandom directly and,
// unlike /dev/zero, incompressible — so the backup pipeline sees a realistic transfer size.
// Host-key checking is disabled since short-lived clones commonly reuse DHCP addresses.
export async function churnVm({
  ip,
  identityFile,
  sizeMb,
  user = 'root',
  targetPath = '~/.qa-churn.bin',
  timeout = 30_000,
}) {
  assert(ip, 'churnVm requires the guest IP (e.g. from vm.waitForGuestIp)')
  assert(Number.isFinite(sizeMb) && sizeMb > 0, 'churnVm requires a positive sizeMb')

  const remoteCommand =
    `openssl enc -aes-256-ctr -pass pass:"$(od -An -tx1 -N32 /dev/urandom | tr -d ' \\n')" -nosalt </dev/zero 2>/dev/null ` +
    `| head -c ${sizeMb}M > ${targetPath} && sync`

  const args = [
    '-o',
    'StrictHostKeyChecking=no',
    '-o',
    'UserKnownHostsFile=/dev/null',
    '-o',
    'BatchMode=yes',
    '-o',
    'ConnectTimeout=5',
    // Omitted: falls back to ssh's own default identity files / ssh-agent.
    ...(identityFile ? ['-i', identityFile] : []),
    `${user}@${ip}`,
    remoteCommand,
  ]

  try {
    await execFileAsync('ssh', args, { timeout })
    log.debug('Churned VM disk content', { ip, sizeMb })
  } catch (error) {
    throw new Error(`Failed to churn ${sizeMb}MB on ${ip}`, { cause: error })
  }
}

export function churnSizeMb(diskSizeBytes, percent) {
  assert(Number.isFinite(diskSizeBytes) && diskSizeBytes > 0, 'churnSizeMb requires a positive diskSizeBytes')
  assert(Number.isFinite(percent) && percent > 0, 'churnSizeMb requires a positive percent')

  return Math.round((diskSizeBytes * percent) / 100 / 1024 / 1024)
}
