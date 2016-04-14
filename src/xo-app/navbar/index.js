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
      <a className='navbar-brand xo-brand' href='#'>Xen Orchestra</a>
      <ul className='nav navbar-nav pull-xs-right'>
        <li className='nav-item'>
          <select className='form-control' onChange={this.handleSelectLang} defaultValue={'en'} >
            <option value='en'>English</option>
            <option value='fr'>Français</option>
          </select>
        </li>
        <li className='nav-item nav-user nav-link'>
          <Icon icon='user' fixedWidth/>&nbsp;{user && `${user.email}`}&nbsp;
          <Icon icon='sign-out' fixedWidth/>
        </li>
      </ul>
    </nav>
  }
}
