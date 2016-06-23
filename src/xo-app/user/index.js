import React, { Component } from 'react'
import { autobind, connectStore } from 'utils'
import { getLang, getUser } from 'selectors'

@connectStore({
  lang: getLang,
  user: getUser
})
export default class User extends Component {
  @autobind
  handleSelectLang (event) {
    this.props.selectLang(event.target.value)
  }
  render () {
    const {
      lang,
      user
    } = this.props

    return <div>
      {user && user.email}
      <select className='form-control' onChange={this.handleSelectLang} value={lang} style={{width: '10em'}}>
        <option value='en'>English</option>
        <option value='fr'>Français</option>
        <option value='he'>עברי</option>
        <option value='pt'>Português</option>
      </select>
    </div>
  }
}
