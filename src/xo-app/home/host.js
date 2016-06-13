import _ from 'messages'
import Ellipsis, { EllipsisContainer } from 'ellipsis'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import SingleLineRow from 'single-line-row'
import Tooltip from 'tooltip'
import React, { Component } from 'react'
import {
  addTag,
  removeTag
} from 'xo'
import { Link } from 'react-router'
import { Col } from 'grid'
import { Text } from 'editable'
import {
  BlockLink,
  connectStore
} from 'utils'
import {
  createGetObject
} from 'selectors'

import styles from './index.css'

@connectStore({
  pool: createGetObject((_, props) => props.host.$pool)
})
export default class HostItem extends Component {
  componentWillMount () {
    this.setState({ collapsed: true })
  }

  get _isRunning () {
    const { host } = this.props
    return host && host.power_state === 'Running'
  }

  _addTag = tag => addTag(this.props.host.id, tag)
  _removeTag = tag => removeTag(this.props.host.id, tag)
  // _setNameDescription = nameDescription => editHost(this.props.host, { name_description: nameDescription })
  // _setNameLabel = nameLabel => editHost(this.props.host, { name_label: nameLabel })
  // _start = () => startHost(this.props.host)
  // _stop = () => stopHost(this.props.host)
  // _enable = () => enableHost(this.props.host)
  // _disable = () => disableHost(this.props.host)
  _toggleCollapse = () => this.setState({ collapsed: !this.state.collapsed })
  _onSelect = () => this.props.onSelect(this.props.host.id)

  render () {
    const { host, pool, selected } = this.props
    return <div className={styles.item}>
      <BlockLink to={`/hosts/${host.id}`}>
        <SingleLineRow>
          <Col smallSize={10} mediumSize={9} largeSize={5}>
            <EllipsisContainer>
              <input type='checkbox' checked={selected} onChange={this._onSelect} value={host.id} />
              &nbsp;&nbsp;
              <Tooltip
                content={isEmpty(host.current_operations)
                  ? _(`powerState${host.power_state}`)
                  : <div>{_(`powerState${host.power_state}`)}{' ('}{map(host.current_operations)[0]}{')'}</div>
                }
              >
                {isEmpty(host.current_operations)
                  ? <Icon icon={`${host.power_state.toLowerCase()}`} />
                  : <Icon icon='busy' />
                }
              </Tooltip>
              &nbsp;&nbsp;
              <Ellipsis>
                <Text value={host.name_label} onChange={this._setNameLabel} placeholder={_('vmHomeNamePlaceholder')} useLongClick />
              </Ellipsis>
            </EllipsisContainer>
          </Col>
          <Col mediumSize={4} className='hidden-md-down'>
            <EllipsisContainer>
              <span className={styles.itemActionButons}>
                {this._isRunning
                  ? <span>
                    <Tooltip content={_('stopVmLabel')}>
                      <a onClick={this._stop}>
                        <Icon icon='host-stop' size='1' />
                      </a>
                    </Tooltip>
                  </span>
                  : <span>
                    <Tooltip content={_('startVmLabel')}>
                      <a onClick={this._start}>
                        <Icon icon='host-start' size='1' />
                      </a>
                    </Tooltip>
                  </span>
                }
              </span>
              {' '}
              <Ellipsis>
                <Text value={host.name_description} onChange={this._setNameDescription} placeholder={_('vmHomeDescriptionPlaceholder')} useLongClick />
              </Ellipsis>
            </EllipsisContainer>
          </Col>
          <Col mediumSize={2} className='hidden-sm-down'>
            <Link to={`/${pool.type}s/${pool.id}`}>{pool.name_label}</Link>
          </Col>
          <Col mediumSize={1} className={styles.itemExpandRow}>
            <a className={styles.itemExpandButton}
              onClick={this._toggleCollapse}>
              <Icon icon='nav' fixedWidth />&nbsp;&nbsp;&nbsp;
            </a>
          </Col>
        </SingleLineRow>
      </BlockLink>
    </div>
  }
}
