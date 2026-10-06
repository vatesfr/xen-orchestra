import React from 'react'
import styles from './styles.module.css'

/**
 * A framed technical schematic. Renders hand-drawn SVG diagrams on the same
 * dark board in both themes, matching the <Terminal> component, with a faint
 * dot grid and an engineering-style caption.
 *
 * Wire color convention (keep it consistent across all diagrams):
 *   green #56c288  replication / data safety
 *   gray  #7a8699  client traffic / neutral links
 *   amber #e0a94a  arbitration / tiebreaker paths
 *   red   #ef6a5f  failure / fenced elements
 * Text: #c6d2e1 primary, #7a8699 dim. Boxes: fill rgba(255,255,255,0.04),
 * stroke rgba(255,255,255,0.28).
 */
export interface SchemaProps {
  /** Engineering-drawing caption, e.g. "Fate-shared topology". */
  label: string
  /** Optional legend entries, e.g. [["#56c288", "replication"], ...] */
  legend?: [string, string][]
  /** Max width of the drawing area, e.g. "520px". */
  maxWidth?: string
  /** The inline SVG. */
  children: React.ReactNode
}

export default function Schema({ label, legend, maxWidth = '760px', children }: SchemaProps): JSX.Element {
  return (
    <figure className={styles.board}>
      <div className={styles.canvas}>
        <div className={styles.drawing} style={{ maxWidth }}>
          {children}
        </div>
      </div>
      <figcaption className={styles.caption}>
        <span className={styles.label}>{label}</span>
        {legend && legend.length > 0 ? (
          <span className={styles.legend}>
            {legend.map(([color, text]) => (
              <span key={text} className={styles.legendItem}>
                <span className={styles.swatch} style={{ background: color }} />
                {text}
              </span>
            ))}
          </span>
        ) : null}
      </figcaption>
    </figure>
  )
}
