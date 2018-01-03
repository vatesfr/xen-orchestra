import React from 'react'
import { SelectSubject } from 'select-objects'

export default class Test extends React.PureComponent {
  render () {
    return <div>
      <SelectSubject value='foo bar' />
    </div>
  }
}
