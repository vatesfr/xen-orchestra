import React from 'react'
import useBaseUrl from '@docusaurus/useBaseUrl'
import styles from './styles.module.css'

/**
 * A zoomed detail of a screen: a cropped capture presented with a
 * magnifier tag and a dashed frame, so readers immediately understand
 * this is a close-up of one section, not a full page (full pages wear
 * the <UiShot> browser chrome instead).
 */
export interface UiDetailProps {
  src: string
  /** Alt text, also used as the caption. */
  alt: string
  /** Optional max width, defaults to 560px. */
  width?: number
}

function MagnifierIcon() {
  return (
    <svg viewBox='0 0 24 24' width='12' height='12' aria-hidden='true'>
      <circle cx='10' cy='10' r='6' fill='none' stroke='currentColor' strokeWidth='2.4' />
      <line x1='14.5' y1='14.5' x2='20' y2='20' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' />
    </svg>
  )
}

export default function UiDetail({ src, alt, width = 560 }: UiDetailProps): JSX.Element {
  const url = useBaseUrl(src)
  return (
    <figure className={styles.detail} style={{ maxWidth: `${width}px` }}>
      <span className={styles.tag}>
        <MagnifierIcon /> zoomed detail
      </span>
      <img className={styles.screen} src={url} alt={alt} loading='lazy' />
      <figcaption className={styles.caption}>{alt}</figcaption>
    </figure>
  )
}
