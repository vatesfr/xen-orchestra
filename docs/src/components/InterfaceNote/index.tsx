import React from 'react'
import Link from '@docusaurus/Link'
import styles from './styles.module.css'

/**
 * Standard header note for task pages whose screenshots and procedures
 * are (still) XO 5 based: states what XO 6 covers today and links the
 * comparison page. One component so the wording and look evolve in one
 * place as XO 6 grows.
 */
export default function InterfaceNote({ children }: { children?: React.ReactNode }): JSX.Element {
  return (
    <div className={styles.note}>
      <span className={styles.badge}>XO 5 · XO 6</span>
      <div className={styles.body}>
        {children ?? (
          <>
            This page describes the XO 5 interface. This area is not available in XO 6 yet: use the{' '}
            <strong>XO 5</strong> link in the top-right corner of XO 6.
          </>
        )}{' '}
        <Link to='/xo6/xo6vsxo5'>See what lives where</Link>.
      </div>
    </div>
  )
}
