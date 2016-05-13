import { autobind, connectStore } from 'utils'
import React, { Component } from 'react'

@connectStore([
  'user'
])
export default class User extends Component {
  @autobind
  handleSelectLang (event) {
    this.props.selectLang(event.target.value)
  }
  render () {
    const {
      user
    } = this.props

    return <div>
      {user && user.email}
      <select className='form-control' onChange={this.handleSelectLang} defaultValue={'en'} style={{width: '10em'}}>
        <option value='en'>English</option>
        <option value='fr'>Français</option>
      </select>
    </div>
  }
}
