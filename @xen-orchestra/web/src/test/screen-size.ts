import type { Window as HappyDomWindow } from 'happy-dom'
import { nextTick } from 'vue'

// The UI store reads the screen size from media queries, which happy-dom evaluates against its viewport
const { happyDOM } = window as unknown as HappyDomWindow

// happy-dom's default viewport, not small for the UI store
const DEFAULT_SCREEN_WIDTH = window.innerWidth

// Below the `medium` breakpoint of the UI store
const SMALL_SCREEN_WIDTH = 800

// The viewport outlives the test: it is given its width back once the test is over
export async function resizeToSmallScreen() {
  happyDOM.setViewport({ width: SMALL_SCREEN_WIDTH })
  onTestFinished(() => happyDOM.setViewport({ width: DEFAULT_SCREEN_WIDTH }))
  await nextTick()
}
