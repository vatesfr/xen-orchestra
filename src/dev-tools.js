import DockMonitor from 'redux-devtools-dock-monitor'
import LogMonitor from 'redux-devtools-log-monitor'
import React from 'react'
import { createDevTools } from 'redux-devtools'

// FIXME: disable in production.
export default createDevTools(
  <DockMonitor
    changePositionKey='ctrl-q'
    toggleVisibilityKey='ctrl-h'
  >
    <LogMonitor />
  </DockMonitor>
)
