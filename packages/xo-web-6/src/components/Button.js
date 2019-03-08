import React from 'react'

const Button = ({ ...props }) => {
  if (props.type === undefined && props.form === undefined) {
    props.type = 'button'
  }

  return <button {...props} />
}

export { Button as default }
