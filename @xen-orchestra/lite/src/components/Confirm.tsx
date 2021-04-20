import React from 'react'

import Button from './Button'

const STYLEMODAL: React.CSSProperties = {
  backgroundColor: 'lightgrey',
  border: '1px solid black',
  left: '50%',
  position: 'absolute',
  top: '20%',
  transform: 'translate(-50%,-50%)',
}
interface PropsConfirm {
  confirm: () => void
  message: JSX.Element
  title: JSX.Element
  toggle: () => void
}
const Confirm = React.memo(({ confirm, message, title, toggle }: PropsConfirm) => {
  const _confirm = () => {
    confirm()
    toggle()
  }

  return (
    <div style={{ ...STYLEMODAL }}>
      <p>{title}</p>
      <p>{message}</p>
      <footer>
        <Button label='Ok' onClick={_confirm} />
        <Button label='Cancel' onClick={toggle} />
      </footer>
    </div>
  )
})

export default Confirm
