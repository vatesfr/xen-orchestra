import * as FormGrid from 'form-grid'
import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import Tooltip from 'tooltip'
import { Container } from 'grid'
import { sortBy } from 'lodash'
import { injectState, provideState } from 'reaclette'
import { SelectPool, SelectNetwork } from 'select-objects'

export default decorate([
  provideState({
    effects: {
      onChangePools(__, pool) {
        const { onChange, value } = this.props
        onChange({
          ...value,
          pool,
        })
      },
      onChangeNetwork(__, network) {
        const { onChange, value } = this.props
        onChange({
          ...value,
          network,
        })
      },
      onChangeMasterName(__, ev) {
        const { onChange, value } = this.props
        onChange({
          ...value,
          masterName: ev.target.value,
        })
      },
      onChangeNbNodes(__, ev) {
        const { onChange, value } = this.props
        onChange({
          ...value,
          nbNodes: +ev.target.value,
        })
      },
      onChangeNetworkCidr(__, ev) {
        const { onChange, value } = this.props
        onChange({
          ...value,
          networkCidr: ev.target.value,
        })
      },
      onChangeSshKey(__, ev) {
        const { onChange, value } = this.props
        onChange({
          ...value,
          sshKey: ev.target.value,
        })
      },
    },
    computed: {
      sortedPools: (_, { value }) => sortBy(value.pools, 'name_label'),
    },
  }),
  injectState,
  ({ effects, install, multi, poolPredicate, state, value }) => (
    <Container>
      <FormGrid.Row>
        <label>
          {_('vmImportToPool')}
          &nbsp;
          {install && (
            <Tooltip content={_('hideInstalledPool')}>
              <Icon icon='info' />
            </Tooltip>
          )}
        </label>
        <SelectPool
          className='mb-1'
          onChange={effects.onChangePools}
          predicate={poolPredicate}
          required
          value={value.pool}
        />
      </FormGrid.Row>
      <FormGrid.Row>
        <label>Network</label>
        <SelectNetwork
          className='mb-1'
          onChange={effects.onChangeNetwork}
          required
          value={value.network}
        />
      </FormGrid.Row>
      <FormGrid.Row>
        <label>Master name</label>
        <input
          type='text'
          required
          onChange={effects.onChangeMasterName}
          value={value.masterName}
        />
      </FormGrid.Row>
      <FormGrid.Row>
        <label>Number of nodes</label>
        <input
          type='number'
          required
          onChange={effects.onChangeNbNodes}
          value={value.nbNodes}
        />
      </FormGrid.Row>
      <FormGrid.Row>
        <label>SSH key</label>
        <input
          type='text'
          required
          onChange={effects.onChangeSshKey}
          value={value.sshKey}
        />
      </FormGrid.Row>
      <FormGrid.Row>
        <label>Network CIDR</label>
        <input
          type='text'
          required
          onChange={effects.onChangeNetworkCidr}
          value={value.networkCidr}
        />
      </FormGrid.Row>
    </Container>
  ),
])
