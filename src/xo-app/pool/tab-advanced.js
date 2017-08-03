import React from 'react'

import _ from 'intl'
import Component from 'base-component'
import Copiable from 'copiable'
import SelectFiles from 'select-files'
import Upgrade from 'xoa-upgrade'
import { connectStore } from 'utils'
import { createGetObjectsOfType } from 'selectors'
import { XoSelect } from 'editable'
import { installSupplementalPackOnAllHosts, setPoolMaster } from 'xo'
import {
  Container,
  Row,
  Col
} from 'grid'

@connectStore(() => ({
  master: createGetObjectsOfType('host').find(
    (_, { pool }) => ({ id: pool.master })
  )
}))
class PoolMaster extends Component {
  _getPoolMasterPredicate = host => host.$pool === this.props.pool.id

  _onChange = host => setPoolMaster(host)

  render () {
    const { pool, master } = this.props

    return <XoSelect
      onChange={this._onChange}
      predicate={this._getPoolMasterPredicate}
      value={pool.master}
      xoType='host'
    >
      {master.name_label}
    </XoSelect>
  }
}

export default ({
  pool
}) => <div>
  <h3 className='mb-1'>{_('xenSettingsLabel')}</h3>
  <Container>
    <Row>
      <Col size={3}>
        <strong>{_('uuid')}</strong>
      </Col>
      <Col size={9}>
        <Copiable tagName='div'>
          {pool.uuid}
        </Copiable>
      </Col>
    </Row>
    <Row>
      <Col size={3}>
        <strong>{_('poolHaStatus')}</strong>
      </Col>
      <Col size={9}>
        {pool.HA_enabled
          ? _('poolHaEnabled')
          : _('poolHaDisabled')
        }
      </Col>
    </Row>
    <Row>
      <Col size={3}>
        <strong>{_('setpoolMaster')}</strong>
      </Col>
      <Col size={9}>
        <PoolMaster pool={pool} />
      </Col>
    </Row>
  </Container>
  <h3 className='mt-1 mb-1'>{_('supplementalPackPoolNew')}</h3>
  <Upgrade place='poolSupplementalPacks' required={2}>
    <SelectFiles onChange={file => installSupplementalPackOnAllHosts(pool, file)} />
  </Upgrade>
</div>
