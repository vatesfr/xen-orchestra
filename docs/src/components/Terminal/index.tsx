import React, { useState } from 'react'
import styles from './styles.module.css'

// Auto-coloring for `twinstor status` output: color only the values that carry
// state, mirroring the CLI's own TTY palette. Keyword sets are intentionally
// small and explicit — this is for docs, not a general ANSI renderer.
const GOOD = /^(UpToDate|Connected|ready|active|ok|enabled|healthy|Primary)$/
const WARN = /^(Inconsistent|SyncTarget|SyncSource|Connecting|Secondary|Disconnecting|DISABLED|degraded)$/
const BAD = /^(StandAlone|Diskless|Outdated|DUnknown|Unconnected|critical|frozen|error|Failed)$/

function sevClass(tok: string): string | undefined {
  if (GOOD.test(tok)) return styles.good
  if (WARN.test(tok)) return styles.warn
  if (BAD.test(tok)) return styles.bad
  return undefined
}

function renderLine(line: string, isCommand: boolean): React.ReactNode {
  if (isCommand) {
    return (
      <>
        <span className={styles.dim}># </span>
        <span className={styles.cmd}>{line}</span>
      </>
    )
  }
  // The health verdict dot (●) takes the severity of the verdict word on its line.
  const verdictSev = /\bhealthy\b/.test(line)
    ? styles.good
    : /\bdegraded\b/.test(line)
      ? styles.warn
      : /\bcritical\b/.test(line)
        ? styles.bad
        : undefined

  let inParen = false
  return line.split(/(\s+)/).map((tok, i) => {
    if (tok === '') return null
    if (/^\s+$/.test(tok)) return tok

    let cls: string | undefined
    if (inParen || tok.startsWith('(')) cls = styles.dim // dim parentheticals
    if (tok.startsWith('(')) inParen = true
    if (tok.endsWith(')')) inParen = false

    if (!cls) {
      if (tok === '✓') cls = styles.good
      else if (tok === '⚠') cls = styles.warn
      else if (tok === '✗') cls = styles.bad
      else if (tok === '●') cls = verdictSev
      else if (tok.endsWith(':'))
        cls = styles.dim // labels
      else cls = sevClass(tok)
    }
    return cls ? (
      <span key={i} className={cls}>
        {tok}
      </span>
    ) : (
      tok
    )
  })
}

// Shell mode: every non-empty line is a command behind a root prompt; full-line
// `#` comments and trailing ` # …` comments render dim, like a real session.
// Lines continuing a previous command (trailing backslash) get no prompt.
function renderShellLine(line: string, continuation = false): React.ReactNode {
  if (line.trim() === '') return null
  if (line.trimStart().startsWith('#')) {
    return <span className={styles.dim}>{line}</span>
  }
  const m = line.match(/^(.*?)(\s+#\s.*)$/)
  return (
    <>
      {continuation ? null : <span className={styles.dim}># </span>}
      <span className={styles.cmd}>{m ? m[1] : line}</span>
      {m ? <span className={styles.dim}>{m[2]}</span> : null}
    </>
  )
}

function commandLines(lines: string[], shell: boolean): string[] {
  if (!shell) {
    const first = lines.find(l => l.trim() !== '')
    return first ? [first.trim()] : []
  }
  return lines.filter(l => l.trim() !== '' && !l.trimStart().startsWith('#')).map(l => l.replace(/\s+#\s.*$/, ''))
}

function CopyButton({ text }: { text: string }): JSX.Element {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type='button'
      className={styles.copy}
      aria-label='Copy the commands'
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1500)
        })
      }}
    >
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  )
}

export interface TerminalProps {
  /** Title-bar text, e.g. "root@twinstor-1 — twinstor status". */
  title: string
  /**
   * Shell mode: every non-empty line is a command (dom0 root prompt), and
   * `#` comments are dimmed. Without it, only the first non-empty line is
   * the command and the rest is status-colored output.
   */
  shell?: boolean
  /** The terminal content. */
  children: string
}

export default function Terminal({ title, shell = false, children }: TerminalProps): JSX.Element {
  const lines = String(children)
    .replace(/^\n+|\n+$/g, '')
    .split('\n')
  let commandSeen = false
  let continuation = false
  const toCopy = commandLines(lines, shell).join('\n')

  return (
    <div className={styles.term}>
      <div className={styles.bar}>
        <span className={styles.dots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </span>
        <span className={styles.title}>{title}</span>
        <CopyButton text={toCopy} />
      </div>
      <pre className={styles.screen}>
        {lines.map((line, i) => {
          let node: React.ReactNode
          if (shell) {
            node = renderShellLine(line, continuation)
            continuation = !line.trimStart().startsWith('#') && line.trimEnd().endsWith('\\')
          } else {
            const isCommand = !commandSeen && line.trim() !== ''
            if (isCommand) commandSeen = true
            node = renderLine(line, isCommand)
          }
          return (
            <React.Fragment key={i}>
              {node}
              {i < lines.length - 1 ? '\n' : null}
            </React.Fragment>
          )
        })}
      </pre>
    </div>
  )
}
