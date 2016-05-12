import React from 'react'

const Page = ({ children, header }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      flex: '1',
      maxHeight: '100vh',
      margin: '-1em' /* To offset the padding applied to the wrapper */
    }}>
      <nav style={{
        backgroundColor: '#eee',
        padding: '0.6em',
        paddingBottom: 0,
        flexShrink: 0
      }}>
        {header}
      </nav>
      <div style={{
        flex: '1',
        overflowY: 'auto',
        padding: '1em'
      }}>
        {children}
      </div>
    </div>
  )
}
export { Page as default }
