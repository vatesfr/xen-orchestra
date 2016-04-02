import Icon from 'icon'
import React, { Component } from 'react'
import {
  connectStore,
  propTypes,
  autobind
} from 'utils'

@connectStore([
  'user'
])
@propTypes({
  selectLang: propTypes.func.isRequired
})
export default class Navbar extends Component {
  @autobind
  handleSelectLang (event) {
    // FIXME: find a way to reach selectLang to set the app language
    this.props.selectLang(event.target.value)
  }
  render () {
    const {
      user
    } = this.props
    return <nav className='navbar navbar-full navbar-fixed-top navbar-light bg-faded xo-navbar'>
      <ul className='nav navbar-nav'>
        <li>
          <a className='navbar-brand xo-brand' href='#'>Xen Orchestra</a>
        </li>
        <li className='nav-item pull-xs-right xo-connected-user'>
          <Icon icon='user' fixedWidth/>&nbsp;{user && `${user.email}`}&nbsp;
          <Icon icon='sign-out' fixedWidth/>
        </li>
        <li className='nav-item pull-xs-right xo-language-selector'>
          <select className='form-control' onChange={this.handleSelectLang} defaultValue={'en'} >
            <option value='en'>English</option>
            <option value='fr'>Français</option>
          </select>
        </li>
      </ul>
    </nav>
  }
}
