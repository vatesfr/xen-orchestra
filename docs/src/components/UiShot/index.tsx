import React, { useState } from 'react'
import { useColorMode } from '@docusaurus/theme-common'
import useBaseUrl from '@docusaurus/useBaseUrl'
import styles from './styles.module.css'

/**
 * A product screenshot dressed in a fake browser window, in the same
 * visual family as the <Terminal> frame. Each shot ships a light and a
 * dark capture: the one matching the reader's color mode is shown, and
 * the sun/moon button in the chrome overrides it per screenshot. The
 * window chrome itself follows the screenshot's mode, so the whole
 * browser flips together with the capture.
 */
export interface UiShotProps {
  /** Light-mode capture, e.g. "/img/xo6/dashboard-light.png". */
  light?: string
  /** Dark-mode capture. Provide both for the toggle; provide only one
      and the shot is pinned to that mode, toggle hidden. */
  dark?: string
  /** Alt text, also used as the caption. */
  alt: string
  /** Address shown in the fake URL bar. */
  url?: string
}

function SunIcon() {
  return (
    <svg viewBox='0 0 24 24' width='14' height='14' aria-hidden='true'>
      <circle cx='12' cy='12' r='5' fill='none' stroke='currentColor' strokeWidth='2' />
      <g stroke='currentColor' strokeWidth='2' strokeLinecap='round'>
        <line x1='12' y1='2' x2='12' y2='4.5' />
        <line x1='12' y1='19.5' x2='12' y2='22' />
        <line x1='2' y1='12' x2='4.5' y2='12' />
        <line x1='19.5' y1='12' x2='22' y2='12' />
        <line x1='4.6' y1='4.6' x2='6.4' y2='6.4' />
        <line x1='17.6' y1='17.6' x2='19.4' y2='19.4' />
        <line x1='4.6' y1='19.4' x2='6.4' y2='17.6' />
        <line x1='17.6' y1='6.4' x2='19.4' y2='4.6' />
      </g>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox='0 0 24 24' width='14' height='14' aria-hidden='true'>
      <path
        d='M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export default function UiShot({ light, dark, alt, url = 'https://your-xo/v6/' }: UiShotProps): JSX.Element {
  const { colorMode } = useColorMode()
  const [override, setOverride] = useState<'light' | 'dark' | null>(null)
  const mode = light && dark ? (override ?? colorMode) : light ? 'light' : 'dark'
  const lightSrc = useBaseUrl(light ?? dark)
  const darkSrc = useBaseUrl(dark ?? light)
  const next = mode === 'dark' ? 'light' : 'dark'
  return (
    <figure className={`${styles.browser} ${mode === 'light' ? styles.lightChrome : ''}`}>
      <div className={styles.bar}>
        <span className={styles.dots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </span>
        <span className={styles.address}>{url}</span>
        {light && dark ? (
          <button
            type='button'
            className={styles.toggle}
            title={`Switch screenshot to ${next} mode`}
            aria-label={`Switch screenshot to ${next} mode`}
            onClick={() => setOverride(next)}
          >
            {mode === 'dark' ? <MoonIcon /> : <SunIcon />}
          </button>
        ) : null}
      </div>
      <img className={styles.screen} src={mode === 'dark' ? darkSrc : lightSrc} alt={alt} loading='lazy' />
      <figcaption className={styles.caption}>{alt}</figcaption>
    </figure>
  )
}
