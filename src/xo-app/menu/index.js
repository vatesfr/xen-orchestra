import _ from 'messages'
import React, { Component } from 'react'
import IndexLink from 'react-router/lib/IndexLink'
import Link from 'react-router/lib/Link'

import Icon from 'icon'
import { Row, Col } from 'grid'

export default class Menu extends Component {
  render () {
    return this.props.collapsed
      ? <div className='xo-menu-uncollapse' role='click' onClick={this.props.toggleCollapse}>
        <Icon icon='menu-uncollapse' size='lg'/>
      </div>
      : <div className='xo-menu'>
        <ul className='nav nav-pills nav-stacked'>
          <li className='nav-item nav-link'>
            &nbsp;
            <span className='pull-xs-right' role='click' onClick={this.props.toggleCollapse}>
              <Icon icon='menu-collapse' size='lg'/>
            </span>
          </li>
          <MenuLinkItem title='home' label='homePage' />
          <MenuLinkItem title='about' label='aboutPage' />
        </ul>
      </div>
  }
}

const MenuLinkItem = (props) => {
  const { title, label } = props
  const [ LinkComponent, path ] = title === 'home'
    ? [ IndexLink, '/' ] : [ Link, `/${title}` ]
  return <li className='nav-item xo-menu-item'>
    <LinkComponent activeClassName='xo-menu-item-selected' className='nav-link' to={path}>
      <Row>
        <Col size={3}>
          <Icon icon={`menu-${title}`} size='lg' fixedWidth/>
        </ Col>
        <Col size={9}>
          {_(label)}
        </ Col>
      </ Row>
    </LinkComponent>
  </li>
}
