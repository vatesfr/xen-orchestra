import React, { Component } from 'react'
import classNames from 'classnames'
import {
  connectStore,
  propTypes
} from 'utils'

@connectStore([
  'user',
  'status',
  'lang'
])
@propTypes({
  selectLang: propTypes.func.isRequired
})
export default class Navbar extends Component {
  render () {
    const {
      user,
      status,
      lang
    } = this.props
    return <nav style={{height: '3em'}} className='navbar navbar-dark bg-inverse navbar-fixed-top'>
      <a className='navbar-brand'>Xen-Orchestra</a>
      <div className='pull-xs-right navbar-nav'>
        <div className='nav-link active'>{status[0].toUpperCase() + status.slice(1)}{user && ` as ${user.email}`}</div>
      </div>
      <div className='pull-xs-right nav navbar-nav' style={{marginRight: '5em'}}>
        <div
          className={classNames(
            'nav-item',
            'nav-link',
            lang === 'en' && 'active'
          )}
          onClick={() => this.props.selectLang('en')}
          role='click'
        >EN</div>
        <div
          className={classNames(
            'nav-item',
            'nav-link',
            lang === 'fr' && 'active'
          )}
          onClick={() => this.props.selectLang('fr')}
          role='click'
        >FR</div>
      </div>
    </nav>
  }
}
