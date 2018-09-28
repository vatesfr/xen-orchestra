import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import Icon from 'icon'
import React from 'react'
import renderXoItem from 'render-xo-item'
import SingleLineRow from 'single-line-row'
import Tooltip from 'tooltip'
import { Container, Col } from 'grid'
import { connectStore } from 'utils'
import {
  createCounter,
  createFilter,
  createGetObject,
  createGetObjectsOfType,
  createSelector,
} from 'selectors'
import { map, some } from 'lodash'
import { SelectSr } from 'select-objects'
import { ejectCd, setDefaultSr } from 'xo'

@connectStore(() => {
  const getPool = createGetObject((_, props) => props.pool)
  return {
    pool: getPool,
    poolMaster: createGetObject(
      createSelector(getPool, ({ master }) => master)
    ),
    vms: createGetObjectsOfType('VM'),
    vbds: createGetObjectsOfType('VBD'),
  }
})
export default class InstallPoolModalBody extends Component {
  _getVmsWithCds = createFilter(
    () => this.props.vms,
    createSelector(
      () => this.props.vbds,
      () => this.props.pool.id,
      (vbds, poolId) => vm => {
        let vbd
        return (
          vm.$pool === poolId &&
          some(
            vm.$VBDs,
            vbdId => (vbd = vbds[vbdId]).is_cd_drive && vbd.VDI !== undefined
          )
        )
      }
    )
  )

  _getNVmsWithCds = createCounter(this._getVmsWithCds)

  _ejectCds = () => Promise.all(Object.keys(this._getVmsWithCds()).map(ejectCd))

  _getTooltip = createSelector(this._getVmsWithCds, vms =>
    map(vms, vm => (
      <p className='m-0' key={vm.id}>
        {renderXoItem(vm)}
      </p>
    ))
  )

  render () {
    const { pool, poolMaster } = this.props
    const needDefaultSr =
      poolMaster.productBrand !== 'XCP-ng' && pool.default_SR === undefined
    const someCdsInserted = this._getNVmsWithCds() > 0

    return (
      <Container>
        {!needDefaultSr &&
          !someCdsInserted && (
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
                  predicate={({ $pool }) => $pool === pool.id}
                  value={this.state.sr}
                />
                <span className='input-group-btn'>
                  <ActionButton
                    handler={setDefaultSr}
                    handlerParam={this.state.sr}
                    icon='save'
                  >
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
                <Icon icon='alarm' />{' '}
                {_('vmsHaveCds', { nVms: this._getNVmsWithCds() })}
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
