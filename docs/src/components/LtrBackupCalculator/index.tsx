import React, { useMemo, useState } from 'react'
import styles from './styles.module.css'

/**
 * Browser reimplementation of the retention logic from
 * `@xen-orchestra/backups/_getOldEntries.mjs`, plus the full-backup-chain
 * accounting, so users can explore how LTR + full-backup interval drive the
 * number of full backups stored on the remote.
 *
 * Assumptions (documented on the page):
 *  - backups run on a fixed schedule (configurable runs/day)
 *  - one restore point per run
 *  - week buckets use ISO weeks (close to XO's locale weeks with default settings)
 *  - times are computed in UTC (bucket boundaries shift by a few hours vs. a
 *    real timezone, which does not change the counts)
 */

const DAY = 24 * 3600 * 1000

type Entry = { id: string; timestamp: number; globalIndex: number }
type LtrConfig = { daily: number; weekly: number; monthly: number; yearly: number }
type BackupMode = 'incremental' | 'full'

const pad = (n: number, len = 2) => String(n).padStart(len, '0')

// --- bucket key formatters (mirror LTR_DEFINITIONS in _getOldEntries.mjs) ---
function dayKey(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}
function monthKey(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`
}
function yearKey(d: Date) {
  return `${d.getUTCFullYear()}`
}
function isoWeekKey(d: Date) {
  // ISO-8601 week number, matches moment 'gggg-ww' closely with default settings
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNum = (date.getUTCDay() + 6) % 7 // Mon=0..Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3) // nearest Thursday
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4))
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3)
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * DAY))
  return `${date.getUTCFullYear()}-${pad(week)}`
}

const FORMATTERS: Record<keyof LtrConfig, (d: Date) => string> = {
  daily: dayKey,
  weekly: isoWeekKey,
  monthly: monthKey,
  yearly: yearKey,
}

type Bucket = { remaining: number; lastMatchingBucket: string | null; entries: Map<string, Entry> }

/** Port of getLtrEntries(): keep the N most-recent buckets per duration. */
function getLtrEntries(entries: Entry[], ltr: LtrConfig) {
  const buckets = new Map<keyof LtrConfig, Bucket>()
  for (const duration of Object.keys(FORMATTERS) as (keyof LtrConfig)[]) {
    const retention = ltr[duration]
    if (retention > 0) {
      buckets.set(duration, { remaining: retention, lastMatchingBucket: null, entries: new Map() })
    }
  }
  // newest -> oldest (entries are sorted ascending, so iterate from the end)
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i]
    const date = new Date(entry.timestamp)
    for (const [duration, bucket] of buckets) {
      const key = FORMATTERS[duration](date)
      if (bucket.lastMatchingBucket !== key) {
        if (bucket.remaining === 0) continue
        bucket.lastMatchingBucket = key
        bucket.remaining -= 1
      }
      bucket.entries.set(key, entry) // last write (oldest of the bucket) wins
    }
  }
  return buckets
}

/** Port of getOldEntries(): everything not kept by minRetentionCount or LTR. */
function computeKept(entries: Entry[], minRetentionCount: number, ltr: LtrConfig) {
  const kept = new Set<Entry>()
  for (let i = Math.max(0, entries.length - minRetentionCount); i < entries.length; i++) {
    kept.add(entries[i])
  }
  const buckets = getLtrEntries(entries, ltr)
  for (const bucket of buckets.values()) {
    for (const entry of bucket.entries.values()) kept.add(entry)
  }
  return { kept, buckets }
}

type Result = {
  keptCount: number
  spanDays: number
  fullsExample: number
  fullsMin: number
  fullsMax: number
  blocks: { block: number; daysAgo: number[] }[]
  // storage estimate (GiB), for the example alignment
  fullGiB: number
  deltaGiB: number
  repoGiB: number
  allFullGiB: number
  // immutability (worst case)
  minImmutableChainLen: number
  immutabilityFullyMutable: boolean
  fullIntervalDays: number
}

function compute(
  runsPerDay: number,
  backupRetention: number,
  fullInterval: number,
  ltr: LtrConfig,
  diskUsageGiB: number,
  changeRate: number,
  immutableDays: number
): Result {
  const f = Math.max(1, Math.round(runsPerDay))
  const step = DAY / f

  // History long enough to cover the widest LTR bucket, with margin.
  const spanNeededDays =
    Math.max(backupRetention / f, ltr.daily, ltr.weekly * 7, ltr.monthly * 31, ltr.yearly * 366, 1) + 60
  const runs = Math.ceil(spanNeededDays) * f
  const last = Date.UTC(2026, 6, 21, 12, 0, 0) // fixed "now" for determinism

  const entries: Entry[] = []
  for (let k = runs - 1; k >= 0; k--) {
    const globalIndex = runs - 1 - k
    entries.push({ id: `b${globalIndex}`, timestamp: last - k * step, globalIndex })
  }

  const { kept } = computeKept(entries, backupRetention, ltr)
  const keptArr = [...kept].sort((a, b) => a.timestamp - b.timestamp)
  const daysAgo = (e: Entry) => Math.round((last - e.timestamp) / DAY)

  const spanDays = keptArr.length ? daysAgo(keptArr[0]) : 0

  // full backups on disk = distinct full-interval chains touched by a kept point.
  // interval <= 0 means "never take a scheduled full" -> a single chain -> 1 full.
  const blockOf = (idx: number, phase: number) => (fullInterval <= 0 ? 0 : Math.floor((idx + phase) / fullInterval))

  const countFulls = (phase: number) => new Set(keptArr.map(e => blockOf(e.globalIndex, phase))).size

  // sweep every alignment of "today" within a full cycle
  const phases = fullInterval <= 0 ? [0] : Array.from({ length: fullInterval }, (_, p) => p)
  const counts = phases.map(countFulls)
  const fullsMin = Math.min(...counts)
  const fullsMax = Math.max(...counts)
  const fullsExample = countFulls(0)

  // breakdown for the example alignment
  const byBlock = new Map<number, number[]>()
  for (const e of keptArr) {
    const b = blockOf(e.globalIndex, 0)
    if (!byBlock.has(b)) byBlock.set(b, [])
    byBlock.get(b)!.push(daysAgo(e))
  }
  const blocks = [...byBlock.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([block, daysAgoArr]) => ({ block, daysAgo: daysAgoArr.sort((x, y) => x - y) }))

  // --- storage estimate (example alignment) ---
  // Each chain's oldest kept point is a full (~= disk usage). Every other kept
  // point is a delta whose data is the change accumulated over the gap (in
  // backup runs) since the previous kept point in the same chain. Changes are
  // accumulated linearly and capped at 100% (a merged delta never exceeds a full);
  // this ignores block-overlap dedup, so real usage is usually a bit lower.
  const U = Math.max(0, diskUsageGiB)
  const p = Math.min(1, Math.max(0, changeRate / 100))
  const chains = new Map<number, Entry[]>()
  for (const e of keptArr) {
    const b = blockOf(e.globalIndex, 0)
    if (!chains.has(b)) chains.set(b, [])
    chains.get(b)!.push(e)
  }
  let fullGiB = 0
  let deltaGiB = 0
  for (const chainEntries of chains.values()) {
    chainEntries.sort((a, b) => a.globalIndex - b.globalIndex)
    fullGiB += U // oldest point of the chain -> full
    for (let i = 1; i < chainEntries.length; i++) {
      const gap = chainEntries[i].globalIndex - chainEntries[i - 1].globalIndex
      deltaGiB += Math.min(gap * p, 1) * U
    }
  }
  const repoGiB = fullGiB + deltaGiB
  const allFullGiB = keptArr.length * U // naive "every restore point is a full"

  // --- immutability (worst case) ---
  // A chain is protected only while its *full* (oldest backup) is immutable — an
  // immutable delta is useless once its base full can be merged/deleted, so once
  // the full expires the whole chain is effectively mutable.
  //
  // As the immutable window grows it covers whole chains further and further
  // back, so the *contiguous* run of recent restore points whose full is still
  // immutable grows with it. In the worst alignment (a full sitting just past the
  // far edge of the window, orphaning its entire chain) that run is
  //   immutableBackups - fullInterval - 1
  // restore points — it only becomes positive once the window is longer than one
  // full-backup interval, then grows one-for-one with the window.
  //
  // Everything is counted in *backup runs* (restore points): the window holds
  // `immutableDays * f` of them. `fullInterval <= 0` means "never take a new full"
  // → one ever-growing chain whose base full always ages out → nothing protected.
  const immutableBackups = immutableDays * f
  const minImmutableChainLen = fullInterval <= 0 ? 0 : Math.max(0, immutableBackups - fullInterval - 1)
  const immutabilityFullyMutable = immutableDays > 0 && minImmutableChainLen === 0
  const fullIntervalDays = fullInterval > 0 ? fullInterval / f : Infinity

  return {
    keptCount: keptArr.length,
    spanDays,
    fullsExample,
    fullsMin,
    fullsMax,
    blocks,
    fullGiB,
    deltaGiB,
    repoGiB,
    allFullGiB,
    minImmutableChainLen,
    immutabilityFullyMutable,
    fullIntervalDays: Number.isFinite(fullIntervalDays) ? fullIntervalDays : 0,
  }
}

/** Human-friendly size: GiB below 1 TiB, TiB above. */
function fmtSize(giB: number): string {
  if (giB >= 1024) return `${(giB / 1024).toFixed(2)} TiB`
  if (giB >= 100) return `${Math.round(giB)} GiB`
  return `${giB.toFixed(1)} GiB`
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  hint,
  disabled = false,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  hint?: string
  disabled?: boolean
}): JSX.Element {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        type='number'
        min={min}
        value={value}
        disabled={disabled}
        onChange={e => onChange(Math.max(min, Number(e.target.value)))}
        className={styles.input}
      />
      {hint && <span className={styles.hint}>{hint}</span>}
    </label>
  )
}

export default function LtrBackupCalculator(): JSX.Element {
  const [mode, setMode] = useState<BackupMode>('incremental')
  const [runsPerDay, setRunsPerDay] = useState(1)
  const [backupRetention, setBackupRetention] = useState(10)
  const [fullInterval, setFullInterval] = useState(7)
  const [daily, setDaily] = useState(5)
  const [weekly, setWeekly] = useState(3)
  const [monthly, setMonthly] = useState(3)
  const [yearly, setYearly] = useState(0)
  const [diskUsage, setDiskUsage] = useState(50)
  const [changeRate, setChangeRate] = useState(2)
  const [immutableDays, setImmutableDays] = useState(0)

  const isFull = mode === 'full'
  const ltrUsed = daily > 0 || weekly > 0 || monthly > 0 || yearly > 0
  const immutableEnabled = immutableDays > 0
  const immutableError = immutableEnabled && ltrUsed

  // Incremental retention advances by merging/expiring the oldest restore point.
  // The backup that rolls out of retention is `backupRetention` runs old; it can
  // only be merged once it is mutable, i.e. older than the immutable window. So
  // if the window covers the whole retention (immutable backups >= retention),
  // the oldest point is still locked and incremental can never advance.
  const immutableBackups = immutableDays * Math.max(1, Math.round(runsPerDay))
  const oldestNotMutable = immutableEnabled && !isFull && immutableBackups >= backupRetention

  const result = useMemo(
    () =>
      compute(
        runsPerDay,
        backupRetention,
        // full mode = every backup is a full: model it as an interval of 1 so
        // each restore point sits alone in its own chain (no deltas).
        isFull ? 1 : fullInterval,
        { daily, weekly, monthly, yearly },
        diskUsage,
        isFull ? 0 : changeRate,
        immutableDays
      ),
    [
      mode,
      runsPerDay,
      backupRetention,
      fullInterval,
      daily,
      weekly,
      monthly,
      yearly,
      diskUsage,
      changeRate,
      immutableDays,
    ]
  )

  const rangeSuffix = result.fullsMin === result.fullsMax ? '' : ` (range ${result.fullsMin}–${result.fullsMax})`

  return (
    <div className={styles.calculator}>
      <div className={styles.grid}>
        <fieldset className={styles.group}>
          <legend>Schedule</legend>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Backup mode</span>
            <select
              className={`${styles.input} ${styles.select}`}
              value={mode}
              onChange={e => setMode(e.target.value as BackupMode)}
            >
              <option value='incremental'>Incremental (delta)</option>
              <option value='full'>Full</option>
            </select>
            <span className={styles.hint}>
              {isFull ? 'Every backup is a full backup.' : 'First backup is full, the following ones are deltas.'}
            </span>
          </label>
          <NumberField label='Backups per day' value={runsPerDay} onChange={setRunsPerDay} min={1} />
          <NumberField
            label='Full backup interval'
            value={fullInterval}
            onChange={setFullInterval}
            min={0}
            hint={isFull ? 'Disabled in full mode (every backup is a full)' : '0 = never take a new full'}
            disabled={isFull}
          />
        </fieldset>
        <fieldset className={styles.group}>
          <legend>VM &amp; data</legend>
          <NumberField
            label='VM disk usage (GiB)'
            value={diskUsage}
            onChange={setDiskUsage}
            min={0}
            hint='Used data, not provisioned size'
          />
          <NumberField
            label='Change between backups (%)'
            value={changeRate}
            onChange={setChangeRate}
            min={0}
            hint={isFull ? 'Disabled in full mode (no deltas)' : 'Share of the disk that changes each run'}
            disabled={isFull}
          />
        </fieldset>
        <fieldset className={styles.group}>
          <legend>Retention</legend>
          <NumberField label='Backup retention' value={backupRetention} onChange={setBackupRetention} min={0} />

          <NumberField label='Daily' value={daily} onChange={setDaily} />
          <NumberField label='Weekly' value={weekly} onChange={setWeekly} />
          <NumberField label='Monthly' value={monthly} onChange={setMonthly} />
          <NumberField label='Yearly' value={yearly} onChange={setYearly} />
          <NumberField
            label='Immutability duration (days)'
            value={immutableDays}
            onChange={setImmutableDays}
            min={0}
            hint='0 = no immutability'
          />
        </fieldset>
      </div>

      {immutableError && (
        <div className={styles.error} role='alert'>
          <strong>Immutability can’t be combined with long-term retention.</strong> Immutable backups can’t be merged or
          deleted while they are locked, so daily / weekly / monthly / yearly slots would pin an ever-growing set of
          restore points. Set long-term retention to 0 to use immutable storage.
        </div>
      )}

      {!immutableError && oldestNotMutable && (
        <div className={styles.error} role='alert'>
          <strong>Incremental mode can only work if the oldest backups are mutable.</strong> The immutable window (
          {immutableDays} days ≈ {immutableBackups} backups) is at least as long as the backup retention (
          {backupRetention}), so the oldest restore point can never be merged or expired — incremental retention can
          never advance and the backups pile up. Lower the immutable duration below the retention, or switch to full
          mode.
        </div>
      )}

      <div className={styles.results}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{fmtSize(result.repoGiB)}</div>
          <div className={styles.statLabel}>estimated repository size</div>
        </div>
        {immutableEnabled && !immutableError && (
          <div className={styles.stat}>
            <div className={styles.statValue}>{oldestNotMutable ? 0 : result.minImmutableChainLen}</div>
            <div className={styles.statLabel}>worst-case immutable chain (restore points)</div>
          </div>
        )}
        <div className={styles.stat}>
          <div className={styles.statValue}>
            {result.fullsExample}
            {rangeSuffix}
          </div>
          <div className={styles.statLabel}>full backups stored on the remote</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{result.keptCount}</div>
          <div className={styles.statLabel}>restore points kept</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{result.spanDays}</div>
          <div className={styles.statLabel}>days covered (oldest → newest)</div>
        </div>
      </div>

      <p className={styles.breakdown}>
        ≈ <strong>{fmtSize(result.fullGiB)}</strong> of full backups ({result.fullsExample} × {fmtSize(diskUsage)}) +{' '}
        <strong>{fmtSize(result.deltaGiB)}</strong> of deltas. Storing every restore point as a full backup would need{' '}
        <strong>{fmtSize(result.allFullGiB)}</strong>.
      </p>

      {immutableEnabled && !immutableError && !oldestNotMutable && result.immutabilityFullyMutable && (
        <div className={styles.warn} role='alert'>
          <strong>In the worst case the whole chain is mutable.</strong> A chain is protected only while its{' '}
          <em>full</em> backup is immutable, but the full is the oldest point in the chain: by the time a chain of{' '}
          {isFull ? '1 backup' : `${fullInterval} backups`} completes, its full is{' '}
          <strong>≈ {result.fullIntervalDays.toFixed(result.fullIntervalDays < 10 ? 1 : 0)} days</strong> old — older
          than the <strong>{immutableDays}-day</strong> window — so its still-immutable deltas are left without an
          immutable base. Set immutability to at least the full-backup interval to keep complete chains protected.
        </div>
      )}

      {immutableEnabled && !immutableError && !oldestNotMutable && !result.immutabilityFullyMutable && (
        <p className={styles.breakdown}>
          The <strong>{immutableDays}-day</strong> window covers a full chain end-to-end, so even in the worst case a
          complete chain of <strong>{result.minImmutableChainLen}</strong> restore point
          {result.minImmutableChainLen === 1 ? '' : 's'} stays fully immutable (its full backup is still inside the
          window, so every delta on top of it is restorable).
        </p>
      )}

      <details className={styles.details}>
        <summary>How the kept restore points map to full-backup chains</summary>
        <p className={styles.detailsIntro}>
          Each <em>chain</em> keeps exactly one full backup: the oldest restore point still in it absorbs its deleted
          ancestors when XO merges. So the number of full backups equals the number of chains that still hold a kept
          point.
        </p>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Full-backup chain</th>
              <th>Kept restore points (days ago)</th>
            </tr>
          </thead>
          <tbody>
            {result.blocks.map(b => (
              <tr key={b.block}>
                <td>#{b.block}</td>
                <td>{b.daysAgo.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
