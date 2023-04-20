import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import Icon from 'icon'
import React from 'react'
import SingleLineRow from 'single-line-row'
import Tooltip from 'tooltip'
import { Container, Col } from 'grid'
import { connectStore } from 'utils'
import {
  createCollectionWrapper,
  createCounter,
  createGetObject,
  createGetObjectsOfType,
  createSelector,
} from 'selectors'
import forEach from 'lodash/forEach.js'
import { SelectSr } from 'select-objects'
import { Vm } from 'render-xo-item'
import { ejectCd, isSrWritable, setDefaultSr } from 'xo'

@connectStore(
  () => {
    const getPool = createGetObject((_, props) => props.pool)
    return {
      pool: getPool,
      poolMaster: createGetObject(createSelector(getPool, ({ master }) => master)),
      vbds: createGetObjectsOfType('VBD').filter(
        createSelector(
          getPool,
          ({ id }) =>
            vbd =>
              vbd.$pool === id
        )
      ),
    }
  },
  { withRef: true }
)
export default class InstallPoolPatchesModalBody extends Component {
  _getVmsWithCds = createSelector(
    () => this.props.vbds,
    createCollectionWrapper(vbds => {
      const vmIds = []
      forEach(vbds, vbd => {
        if (vbd.is_cd_drive && vbd.VDI !== undefined && vbd.attached && !vmIds.includes(vbd.VM)) {
          vmIds.push(vbd.VM)
        }
      })
      return vmIds
    })
  )

  _getNVmsWithCds = createCounter(this._getVmsWithCds)

  _ejectCds = () => Promise.all(this._getVmsWithCds().map(ejectCd))

  _getTooltip = createSelector(this._getVmsWithCds, vmIds =>
    vmIds.map(vmId => (
      <p className='m-0' key={vmId}>
        <Vm id={vmId} />
      </p>
    ))
  )

  render() {
    const { pool, poolMaster } = this.props
    const needDefaultSr = poolMaster.productBrand !== 'XCP-ng' && pool.default_SR === undefined
    const someCdsInserted = this._getNVmsWithCds() > 0

    return (
      <Container>
        {!needDefaultSr && !someCdsInserted && (
          <SingleLineRow>
            <Col>{_('confirmPoolPatch')}</Col>
          </SingleLineRow>
        )}
        {needDefaultSr && [
          <SingleLineRow className='mt-1' key='message'>
            <Col>
              <Icon icon='alarm' /> {_('poolNeedsDefaultSr')}
            </Col>
          </SingleLineRow>,
          <SingleLineRow className='mt-1' key='select'>
            <Col size={6}>{_('setDefaultSr')}</Col>
            <Col size={5}>
              <div className='input-group'>
                <SelectSr
                  onChange={this.linkState('sr')}
                  predicate={sr => sr.$pool === pool.id && isSrWritable(sr)}
                  value={this.state.sr}
                />
                <span className='input-group-btn'>
                  <ActionButton handler={setDefaultSr} handlerParam={this.state.sr} icon='save'>
                    {_('formOk')}
                  </ActionButton>
                </span>
              </div>
            </Col>
          </SingleLineRow>,
        ]}
        {someCdsInserted && (
          <SingleLineRow className='mt-1'>
            <Tooltip content={this._getTooltip()}>
              <Col size={6}>
                <Icon icon='alarm' /> {_('vmsHaveCds', { nVms: this._getNVmsWithCds() })}
              </Col>
            </Tooltip>
            <Col size={6}>
              <ActionButton icon='vm-eject' handler={this._ejectCds}>
                {_('ejectCds')}
              </ActionButton>
            </Col>
          </SingleLineRow>
        )}
      </Container>
    )
  }
}
