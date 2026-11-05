import React from 'react'
import Link from '@docusaurus/Link'
import styles from './styles.module.css'

/**
 * Quiet link cards for landing pages, in the spirit of enterprise doc
 * portals: a title, one descriptive line, no decoration. Use CardGrid as
 * the container and LinkCard for each entry.
 */
export function CardGrid({ children }: { children: React.ReactNode }): JSX.Element {
  return <div className={styles.grid}>{children}</div>
}

export function LinkCard({
  title,
  href,
  children,
}: {
  title: string
  href: string
  children?: React.ReactNode
}): JSX.Element {
  return (
    <Link to={href} className={styles.card}>
      <span className={styles.title}>{title}</span>
      {children ? <span className={styles.desc}>{children}</span> : null}
    </Link>
  )
}
