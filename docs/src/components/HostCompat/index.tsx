import React, { useState } from 'react'
import styles from './styles.module.css'

/**
 * Host compatibility table with end-of-life versions folded away by
 * default: readers come for "what should I run", not the graveyard.
 */
export interface HostRow {
  version: string
  status: string
  notes?: string
  /** End-of-life platform: hidden until the reader asks for it. */
  eol?: boolean
  /** Recommended row, rendered emphasized. */
  highlight?: boolean
}

export function HostCompatTable({ rows }: { rows: HostRow[] }): JSX.Element {
  const [showEol, setShowEol] = useState(false)
  const eolCount = rows.filter(r => r.eol).length
  const visible = rows.filter(r => showEol || !r.eol)
  return (
    <div className={styles.wrap}>
      <table>
        <thead>
          <tr>
            <th>Version</th>
            <th className={styles.status}>Status</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(r => (
            <tr key={r.version} className={r.eol ? styles.eol : undefined}>
              <td>{r.highlight ? <strong>{r.version}</strong> : r.version}</td>
              <td className={styles.status}>{r.status}</td>
              <td>{r.notes ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {eolCount > 0 ? (
        <button type='button' className={styles.toggle} onClick={() => setShowEol(v => !v)}>
          {showEol ? 'Hide end-of-life versions' : `Show ${eolCount} end-of-life version${eolCount > 1 ? 's' : ''} ☠️`}
        </button>
      ) : null}
    </div>
  )
}

export default HostCompatTable
