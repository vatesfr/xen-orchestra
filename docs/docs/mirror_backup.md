---
sidebar_label: Mirror backups
---

# Mirror backups

The goal is to replicate a backup from one backup repository (BR, formerly called remote) to another. For instance, you make your backup to in-house NFS storage, and then replicate to bigger, slower and cheaper storage with a longer retention.

The source and destination can have different settings for encryption, VHD storage mode, retention, or compression.

A mirror backup is a backup of your backups: XO reads the archives already stored on the source BR and copies the new ones to the destination BR. The VM and the hosts are never involved in the transfer:

<Schema label="A mirror backup copies existing archives from one BR to another: the VM is only exported once by its normal backup job, then XO mirrors the archives to a bigger, slower, cheaper BR with a longer retention" legend={[["#e0a94a", "backup archive"], ["#5ac8c8", "mirror transfer"], ["#8e83fe", "Xen Orchestra"]]} maxWidth="640px">
<svg viewBox="0 0 640 260" role="img" aria-label="A VM is exported by its normal backup job to a source backup repository holding archives B, C and D; Xen Orchestra orchestrates a mirror transfer that copies the new archives to a bigger destination backup repository with a longer retention, holding A, B, C and D; the VM and hosts are not involved in the mirror transfer">
  <rect x="272" y="16" width="96" height="32" rx="6" fill="rgba(255,255,255,0.04)" stroke="#8e83fe" />
  <text x="320" y="36" fill="#c6d2e1" fontSize="11" textAnchor="middle">Xen Orchestra</text>
  <line x1="296" y1="48" x2="204" y2="94" stroke="rgba(255,255,255,0.22)" strokeDasharray="4 4" />
  <line x1="344" y1="48" x2="448" y2="74" stroke="rgba(255,255,255,0.22)" strokeDasharray="4 4" />
  <text x="320" y="66" fill="#7a8699" fontSize="9" textAnchor="middle">orchestrates</text>
  <rect x="40" y="16" width="64" height="36" rx="6" fill="rgba(255,255,255,0.04)" stroke="#56c288" />
  <text x="72" y="38" fill="#c6d2e1" fontSize="12" textAnchor="middle">VM</text>
  <line x1="72" y1="52" x2="72" y2="88" stroke="#56c288" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="72,96 66,86 78,86" fill="#56c288" />
  <text x="80" y="76" fill="#56c288" fontSize="9">backup job</text>
  <rect x="24" y="96" width="216" height="140" rx="8" fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5" />
  <text x="36" y="118" fill="#c6d2e1" fontSize="12">Source BR</text>
  <text x="36" y="134" fill="#7a8699" fontSize="10">fast storage, short retention</text>
  <rect x="40" y="148" width="56" height="40" rx="6" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="68" y="172" fill="#c6d2e1" fontSize="13" textAnchor="middle">B</text>
  <rect x="104" y="148" width="56" height="40" rx="6" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="132" y="172" fill="#c6d2e1" fontSize="13" textAnchor="middle">C</text>
  <rect x="168" y="148" width="56" height="40" rx="6" fill="rgba(224,169,74,0.12)" stroke="#e0a94a" />
  <text x="196" y="172" fill="#c6d2e1" fontSize="13" textAnchor="middle">D</text>
  <line x1="246" y1="168" x2="360" y2="168" stroke="#5ac8c8" strokeWidth="2" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="372,168 360,162 360,174" fill="#5ac8c8" />
  <text x="308" y="154" fill="#5ac8c8" fontSize="11" textAnchor="middle">mirror</text>
  <text x="308" y="188" fill="#7a8699" fontSize="9" textAnchor="middle">new backups only</text>
  <rect x="376" y="76" width="248" height="170" rx="8" fill="none" stroke="rgba(255,255,255,0.22)" strokeDasharray="6 5" />
  <text x="388" y="98" fill="#c6d2e1" fontSize="12">Destination BR</text>
  <text x="388" y="114" fill="#7a8699" fontSize="10">bigger, slower, cheaper</text>
  <rect x="392" y="148" width="52" height="40" rx="6" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="418" y="172" fill="#c6d2e1" fontSize="13" textAnchor="middle">A</text>
  <rect x="450" y="148" width="52" height="40" rx="6" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="476" y="172" fill="#c6d2e1" fontSize="13" textAnchor="middle">B</text>
  <rect x="508" y="148" width="52" height="40" rx="6" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="534" y="172" fill="#c6d2e1" fontSize="13" textAnchor="middle">C</text>
  <rect x="566" y="148" width="52" height="40" rx="6" fill="rgba(224,169,74,0.12)" stroke="#e0a94a" />
  <text x="592" y="172" fill="#c6d2e1" fontSize="13" textAnchor="middle">D</text>
  <text x="388" y="226" fill="#7a8699" fontSize="10">longer retention: keeps more restore points</text>
</svg>
</Schema>

## Creation

In the Backup view, create a new backup job and select **Mirror backup**.
Then, choose whether you want to mirror incremental backups or full backups.
A mirror backup job has exactly one source repository and one or more destinations. The mirroring speed is limited by the slowest repository.

Most options of the full/incremental backup jobs also apply here, like concurrency (number of VMs transferred in parallel), reports, proxy and speed limit. You can also add a health check on schedules. Please note that only the last transferred backup (if any) will be checked.

:::tip
If you have full and incremental backups on a repository, you must configure 2 mirror backup jobs, one full and one incremental.
:::

## Synchronizing algorithm for full backups {#synchronizing-algorithm-for-full-backups}

Any new backup on the source is transferred to the destination. Each side then applies its own retention: the source window slides forward while the destination, with its longer retention, keeps one more restore point before deleting anything.

<Schema label="Three runs of a full mirror: each run copies only the new archive, the source window slides (retention 3) while the destination accumulates until its own retention of 4 forces the oldest archive out" legend={[["#e0a94a", "full backup"], ["#5ac8c8", "transfer"], ["#ef6a5f", "deleted on destination"]]} maxWidth="640px">
<svg viewBox="0 0 640 244" role="img" aria-label="Three rows show successive mirror runs. Run 1: the source holds A, B and C, all three are transferred, the destination holds A, B and C. Run 2: the source slides to B, C and D, only D is transferred, the destination holds A, B, C and D. Run 3: the source slides to C, D and E, only E is transferred, and A is deleted from the destination because its retention of 4 is exceeded, leaving B, C, D and E">
  <text x="130" y="22" fill="#c6d2e1" fontSize="12" textAnchor="middle">Source BR (retention 3)</text>
  <text x="442" y="22" fill="#c6d2e1" fontSize="12" textAnchor="middle">Destination BR (retention 4)</text>
  <text x="16" y="60" fill="#7a8699" fontSize="10">run 1</text>
  <rect x="68" y="40" width="36" height="32" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="86" y="60" fill="#c6d2e1" fontSize="12" textAnchor="middle">A</text>
  <rect x="112" y="40" width="36" height="32" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="130" y="60" fill="#c6d2e1" fontSize="12" textAnchor="middle">B</text>
  <rect x="156" y="40" width="36" height="32" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="174" y="60" fill="#c6d2e1" fontSize="12" textAnchor="middle">C</text>
  <line x1="204" y1="56" x2="308" y2="56" stroke="#5ac8c8" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="318,56 307,50.5 307,61.5" fill="#5ac8c8" />
  <text x="260" y="48" fill="#5ac8c8" fontSize="10" textAnchor="middle">A, B, C</text>
  <rect x="336" y="40" width="36" height="32" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="354" y="60" fill="#c6d2e1" fontSize="12" textAnchor="middle">A</text>
  <rect x="380" y="40" width="36" height="32" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="398" y="60" fill="#c6d2e1" fontSize="12" textAnchor="middle">B</text>
  <rect x="424" y="40" width="36" height="32" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="442" y="60" fill="#c6d2e1" fontSize="12" textAnchor="middle">C</text>
  <text x="16" y="124" fill="#7a8699" fontSize="10">run 2</text>
  <rect x="68" y="104" width="36" height="32" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="86" y="124" fill="#c6d2e1" fontSize="12" textAnchor="middle">B</text>
  <rect x="112" y="104" width="36" height="32" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="130" y="124" fill="#c6d2e1" fontSize="12" textAnchor="middle">C</text>
  <rect x="156" y="104" width="36" height="32" rx="5" fill="rgba(224,169,74,0.12)" stroke="#e0a94a" />
  <text x="174" y="124" fill="#c6d2e1" fontSize="12" textAnchor="middle">D</text>
  <line x1="204" y1="120" x2="308" y2="120" stroke="#5ac8c8" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="318,120 307,114.5 307,125.5" fill="#5ac8c8" />
  <text x="260" y="112" fill="#5ac8c8" fontSize="10" textAnchor="middle">D only</text>
  <rect x="336" y="104" width="36" height="32" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="354" y="124" fill="#c6d2e1" fontSize="12" textAnchor="middle">A</text>
  <rect x="380" y="104" width="36" height="32" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="398" y="124" fill="#c6d2e1" fontSize="12" textAnchor="middle">B</text>
  <rect x="424" y="104" width="36" height="32" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="442" y="124" fill="#c6d2e1" fontSize="12" textAnchor="middle">C</text>
  <rect x="468" y="104" width="36" height="32" rx="5" fill="rgba(224,169,74,0.12)" stroke="#e0a94a" />
  <text x="486" y="124" fill="#c6d2e1" fontSize="12" textAnchor="middle">D</text>
  <text x="16" y="188" fill="#7a8699" fontSize="10">run 3</text>
  <rect x="68" y="168" width="36" height="32" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="86" y="188" fill="#c6d2e1" fontSize="12" textAnchor="middle">C</text>
  <rect x="112" y="168" width="36" height="32" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="130" y="188" fill="#c6d2e1" fontSize="12" textAnchor="middle">D</text>
  <rect x="156" y="168" width="36" height="32" rx="5" fill="rgba(224,169,74,0.12)" stroke="#e0a94a" />
  <text x="174" y="188" fill="#c6d2e1" fontSize="12" textAnchor="middle">E</text>
  <line x1="204" y1="184" x2="308" y2="184" stroke="#5ac8c8" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="318,184 307,178.5 307,189.5" fill="#5ac8c8" />
  <text x="260" y="176" fill="#5ac8c8" fontSize="10" textAnchor="middle">E only</text>
  <rect x="336" y="168" width="36" height="32" rx="5" fill="rgba(239,106,95,0.08)" stroke="#ef6a5f" />
  <text x="354" y="188" fill="#ef6a5f" fontSize="12" textAnchor="middle">A</text>
  <text x="354" y="216" fill="#ef6a5f" fontSize="9" textAnchor="middle">deleted</text>
  <rect x="380" y="168" width="36" height="32" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="398" y="188" fill="#c6d2e1" fontSize="12" textAnchor="middle">B</text>
  <rect x="424" y="168" width="36" height="32" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="442" y="188" fill="#c6d2e1" fontSize="12" textAnchor="middle">C</text>
  <rect x="468" y="168" width="36" height="32" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="486" y="188" fill="#c6d2e1" fontSize="12" textAnchor="middle">D</text>
  <rect x="512" y="168" width="36" height="32" rx="5" fill="rgba(224,169,74,0.12)" stroke="#e0a94a" />
  <text x="530" y="188" fill="#c6d2e1" fontSize="12" textAnchor="middle">E</text>
  <text x="442" y="216" fill="#7a8699" fontSize="9" textAnchor="middle">run 3: retention 4 exceeded, A is deleted</text>
</svg>
</Schema>

_Each letter is a full backup archive. The source has a retention of 3, the destination a retention of 4._

### First transfer

```
- source : ABC
- destination: empty
```

XO transfers A, then B, then C. The destination now contains ABC.

:::warning
**Limitation:** if the mirror retention is lower than the backup retention on the source repository, more data than necessary may be transferred during the first run, since all the backups of the source will be transferred to the destinations. Then the older backups will be purged on the destinations.
:::

### Second transfer

```
- source : BCD
- destination: ABC
```

Only D is transferred. The destination now contains ABCD.

### Third transfer

```
- source : CDE
- destination: ABCD
```

Only E is transferred, and A is deleted from the destination because its retention of 4 is now exceeded. The destination now contains BCDE.

### If there is too much change on the source {#if-there-is-too-much-change-on-source}

```
- source : IJK
- destination:  BCDE
```

I, J and K are transferred in order, and B, C and D are deleted from the destination. The destination now contains EIJK.

## Synchronizing algorithm for incremental backups

This job only transfers new backups, then runs the same merge algorithm as [Incremental Backups](xo5/incremental_backups.md) on the destination. Since each side applies its own retention, the merges happen independently: the source merges sooner (retention 3), the destination later (retention 4).

<Schema label="Three runs of an incremental mirror: only the new deltas cross the wire, and each BR merges its own chain when its own retention is exceeded, the source after run 1, the destination one run later" legend={[["#e0a94a", "key (full) backup"], ["#6aabf0", "delta"], ["#5ac8c8", "transfer"]]} maxWidth="640px">
<svg viewBox="0 0 640 266" role="img" aria-label="Three rows show successive mirror runs of an incremental chain. Run 1: the source holds key A plus deltas b and c, all three are transferred, the destination holds A, b and c. Run 2: the source has merged A and b into key B and holds B, c and d, only the delta d is transferred, the destination holds A, b, c and d with no merge yet. Run 3: the source holds C, d and e, only the delta e is transferred, and the destination now merges A and b into B, holding B, c, d and e">
  <text x="124" y="22" fill="#c6d2e1" fontSize="12" textAnchor="middle">Source BR (retention 3)</text>
  <text x="412" y="22" fill="#c6d2e1" fontSize="12" textAnchor="middle">Destination BR (retention 4)</text>
  <text x="16" y="64" fill="#7a8699" fontSize="10">run 1</text>
  <rect x="68" y="44" width="36" height="32" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="86" y="64" fill="#c6d2e1" fontSize="12" textAnchor="middle">A</text>
  <rect x="112" y="47" width="30" height="26" rx="4" fill="rgba(255,255,255,0.04)" stroke="#6aabf0" />
  <text x="127" y="64" fill="#c6d2e1" fontSize="11" textAnchor="middle">b</text>
  <rect x="150" y="47" width="30" height="26" rx="4" fill="rgba(255,255,255,0.04)" stroke="#6aabf0" />
  <text x="165" y="64" fill="#c6d2e1" fontSize="11" textAnchor="middle">c</text>
  <line x1="204" y1="60" x2="308" y2="60" stroke="#5ac8c8" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="318,60 307,54.5 307,65.5" fill="#5ac8c8" />
  <text x="260" y="52" fill="#5ac8c8" fontSize="10" textAnchor="middle">A, b, c</text>
  <rect x="336" y="44" width="36" height="32" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="354" y="64" fill="#c6d2e1" fontSize="12" textAnchor="middle">A</text>
  <rect x="380" y="47" width="30" height="26" rx="4" fill="rgba(255,255,255,0.04)" stroke="#6aabf0" />
  <text x="395" y="64" fill="#c6d2e1" fontSize="11" textAnchor="middle">b</text>
  <rect x="418" y="47" width="30" height="26" rx="4" fill="rgba(255,255,255,0.04)" stroke="#6aabf0" />
  <text x="433" y="64" fill="#c6d2e1" fontSize="11" textAnchor="middle">c</text>
  <text x="16" y="132" fill="#7a8699" fontSize="10">run 2</text>
  <rect x="68" y="112" width="36" height="32" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="86" y="132" fill="#c6d2e1" fontSize="12" textAnchor="middle">B</text>
  <rect x="112" y="115" width="30" height="26" rx="4" fill="rgba(255,255,255,0.04)" stroke="#6aabf0" />
  <text x="127" y="132" fill="#c6d2e1" fontSize="11" textAnchor="middle">c</text>
  <rect x="150" y="115" width="30" height="26" rx="4" fill="rgba(106,171,240,0.12)" stroke="#6aabf0" />
  <text x="165" y="132" fill="#c6d2e1" fontSize="11" textAnchor="middle">d</text>
  <text x="68" y="160" fill="#e0a94a" fontSize="9">A + b merged into B</text>
  <line x1="204" y1="128" x2="308" y2="128" stroke="#5ac8c8" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="318,128 307,122.5 307,133.5" fill="#5ac8c8" />
  <text x="260" y="120" fill="#5ac8c8" fontSize="10" textAnchor="middle">d only</text>
  <rect x="336" y="112" width="36" height="32" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="354" y="132" fill="#c6d2e1" fontSize="12" textAnchor="middle">A</text>
  <rect x="380" y="115" width="30" height="26" rx="4" fill="rgba(255,255,255,0.04)" stroke="#6aabf0" />
  <text x="395" y="132" fill="#c6d2e1" fontSize="11" textAnchor="middle">b</text>
  <rect x="418" y="115" width="30" height="26" rx="4" fill="rgba(255,255,255,0.04)" stroke="#6aabf0" />
  <text x="433" y="132" fill="#c6d2e1" fontSize="11" textAnchor="middle">c</text>
  <rect x="456" y="115" width="30" height="26" rx="4" fill="rgba(106,171,240,0.12)" stroke="#6aabf0" />
  <text x="471" y="132" fill="#c6d2e1" fontSize="11" textAnchor="middle">d</text>
  <text x="336" y="160" fill="#7a8699" fontSize="9">no merge: retention 4 not exceeded</text>
  <text x="16" y="208" fill="#7a8699" fontSize="10">run 3</text>
  <rect x="68" y="188" width="36" height="32" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="86" y="208" fill="#c6d2e1" fontSize="12" textAnchor="middle">C</text>
  <rect x="112" y="191" width="30" height="26" rx="4" fill="rgba(255,255,255,0.04)" stroke="#6aabf0" />
  <text x="127" y="208" fill="#c6d2e1" fontSize="11" textAnchor="middle">d</text>
  <rect x="150" y="191" width="30" height="26" rx="4" fill="rgba(106,171,240,0.12)" stroke="#6aabf0" />
  <text x="165" y="208" fill="#c6d2e1" fontSize="11" textAnchor="middle">e</text>
  <text x="68" y="236" fill="#e0a94a" fontSize="9">B + c merged into C</text>
  <line x1="204" y1="204" x2="308" y2="204" stroke="#5ac8c8" className="schema-flow" strokeDasharray="5 4" />
  <polygon points="318,204 307,198.5 307,209.5" fill="#5ac8c8" />
  <text x="260" y="196" fill="#5ac8c8" fontSize="10" textAnchor="middle">e only</text>
  <rect x="336" y="188" width="36" height="32" rx="5" fill="rgba(255,255,255,0.04)" stroke="#e0a94a" />
  <text x="354" y="208" fill="#c6d2e1" fontSize="12" textAnchor="middle">B</text>
  <rect x="380" y="191" width="30" height="26" rx="4" fill="rgba(255,255,255,0.04)" stroke="#6aabf0" />
  <text x="395" y="208" fill="#c6d2e1" fontSize="11" textAnchor="middle">c</text>
  <rect x="418" y="191" width="30" height="26" rx="4" fill="rgba(255,255,255,0.04)" stroke="#6aabf0" />
  <text x="433" y="208" fill="#c6d2e1" fontSize="11" textAnchor="middle">d</text>
  <rect x="456" y="191" width="30" height="26" rx="4" fill="rgba(106,171,240,0.12)" stroke="#6aabf0" />
  <text x="471" y="208" fill="#c6d2e1" fontSize="11" textAnchor="middle">e</text>
  <text x="336" y="236" fill="#e0a94a" fontSize="9">A + b merged into B</text>
  <text x="320" y="258" fill="#7a8699" fontSize="10" textAnchor="middle">Each BR merges independently: the destination merges one run later because its retention is longer</text>
</svg>
</Schema>

_Key (full) backups are in uppercase, delta backups in lowercase. The source has a retention of 3, the destination a retention of 4._

### First transfer

```
- source : Abc # one key, two delta
- destination: empty
```

XO transfers A, then b, then c. The destination now contains Abc.

:::warning
**Limitation:** if the mirror retention is lower than the backup retention on the source repository, more data than necessary may be transferred during the first run, since all the backups of the source will be transferred to the destinations. Then the older backups will be purged on the destinations.
:::

### Second transfer

```
- source : Bcd # A and b have been merged
- destination:  Abc
```

Only the delta d is transferred. The destination now contains Abcd (no merge yet: its retention of 4 is not exceeded).

### Third transfer

```
- source : Cde # B and c have been merged
- destination:  Abcd
```

Only the delta e is transferred. The destination now contains Bcde (A is merged into b on the destination).

### If there is too much change on the source {#if-there-is-too-much-change-on-source-1}

```
- source : Ijk
- destination:  Bcde
```

The whole chain is transferred in order. The destination now contains EIjk (B, c and d are merged into e).
