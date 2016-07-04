import _ from 'intl'
import Component from 'base-component'
import Ellipsis, { EllipsisContainer } from 'ellipsis'
import flatMap from 'lodash/flatMap'
import Icon from 'icon'
import map from 'lodash/map'
import React from 'react'
import reduce from 'lodash/reduce'
import SingleLineRow from 'single-line-row'
import size from 'lodash/size'
import Tags from 'tags'
import Tooltip from 'tooltip'
import { BlockLink } from 'link'
import { Row, Col } from 'grid'
import { Text } from 'editable'
import {
  addTag,
  editPool,
  getHostMissingPatches,
  removeTag
} from 'xo'
import {
  connectStore,
  formatSize
} from 'utils'
import {
  createGetObjectsOfType,
  createSelector
} from 'selectors'

import styles from './index.css'

@connectStore(() => {
  const getPoolHosts = createGetObjectsOfType('host').filter(createSelector(
    (_, props) => props.item.id,
    poolId => host => host.$pool === poolId
  ))

  const getMissingPatches = createSelector(
    getPoolHosts,
    hosts => {
      return Promise.all(map(hosts, host => getHostMissingPatches(host)))
      .then(patches => flatMap(patches))
    }
  )

  return {
    hosts: getPoolHosts,
    missingPaths: getMissingPatches
  }
})
export default class PoolItem extends Component {
  _addTag = tag => addTag(this.props.item.id, tag)
  _removeTag = tag => removeTag(this.props.item.id, tag)
  _setNameDescription = nameDescription => editPool(this.props.item, { name_description: nameDescription })
  _setNameLabel = nameLabel => editPool(this.props.item, { name_label: nameLabel })
  _toggleExpanded = () => this.setState({ expanded: !this.state.expanded })
  _onSelect = () => this.props.onSelect(this.props.item.id)

  componentWillMount () {
    this.props.missingPaths.then(patches => this.setState({missingPatchCount: size(patches)}))
  }

  render () {
    const { item: pool, expandAll, selected, hosts } = this.props
    const { missingPatchCount } = this.state
    const hostsCpus = reduce(hosts, (total, host) => total + +host.cpus.cores, 0)
    const hostsMemory = reduce(hosts, (total, host) => total + +host.memory.size, 0)
    return <div className={styles.item}>
      <BlockLink to={`/pools/${pool.id}`}>
        <SingleLineRow>
          <Col smallSize={10} mediumSize={9} largeSize={3}>
            <EllipsisContainer>
              <input type='checkbox' checked={selected} onChange={this._onSelect} value={pool.id} />
              &nbsp;&nbsp;
              <Ellipsis>
                <Text value={pool.name_label} onChange={this._setNameLabel} useLongClick />
              </Ellipsis>
              &nbsp;&nbsp;
              {(missingPatchCount > 0) &&
                <Tooltip content={_('homeMissingPaths')}>
                  <span className='tag tag-pill tag-danger'>{missingPatchCount}</span>
                </Tooltip>
              }
            </EllipsisContainer>
          </Col>
          <Col mediumSize={4} className='hidden-md-down'>
            <EllipsisContainer>
              <Ellipsis>
                <Text value={pool.name_description} onChange={this._setNameDescription} useLongClick />
              </Ellipsis>
            </EllipsisContainer>
          </Col>
          <Col largeSize={4} className='hidden-lg-down'>
            <span>
              {size(hosts)}x <Icon icon='host' />
              {' '}
              {hostsCpus}x <Icon icon='cpu' />
              {' '}
              {formatSize(hostsMemory)}
            </span>
          </Col>
          <Col mediumSize={1} className={styles.itemExpandRow}>
            <a className={styles.itemExpandButton}
              onClick={this._toggleExpanded}>
              <Icon icon='nav' fixedWidth />&nbsp;&nbsp;&nbsp;
            </a>
          </Col>
        </SingleLineRow>
      </BlockLink>
      {(this.state.expanded || expandAll) &&
        <Row>
          <Col mediumSize={6} className={styles.itemExpanded}>
            <span>
              {size(hosts)}x <Icon icon='host' />
              {' '}
              {hostsCpus}x <Icon icon='cpu' />
              {' '}
              {formatSize(hostsMemory)}
            </span>
          </Col>
          <Col mediumSize={6}>
            <span style={{fontSize: '1.4em'}}>
              <Tags labels={pool.tags} onDelete={this._removeTag} onAdd={this._addTag} />
            </span>
          </Col>
        </Row>
      }
    </div>
  }
}
