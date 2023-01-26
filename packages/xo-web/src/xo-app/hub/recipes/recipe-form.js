import * as FormGrid from 'form-grid'
import _, { messages } from 'intl'
import decorate from 'apply-decorators'
import React from 'react'
import { Container } from 'grid'
import { get } from '@xen-orchestra/defined'
import { injectIntl } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { isSrWritable } from 'xo'
import { SelectPool, SelectNetwork, SelectSr } from 'select-objects'

export default decorate([
  injectIntl,
  provideState({
    effects: {
      onChangePool(__, pool) {
        const { onChange, value } = this.props
        onChange({
          ...value,
          pool,
        })
      },
      onChangeSr(__, sr) {
        const { onChange, value } = this.props
        onChange({
          ...value,
          sr,
        })
      },
      onChangeNetwork(__, network) {
        const { onChange, value } = this.props
        onChange({
          ...value,
          network,
        })
      },
      onChangeValue(__, ev) {
        const { name, value } = ev.target
        const { onChange, value: prevValue } = this.props
        onChange({
          ...prevValue,
          [name]: value,
        })
      },
      onChangeWorkerIp(__, ev) {
        const { name, value } = ev.target
        const { onChange, value: prevValue } = this.props
        const workerNodeIpAddresses = prevValue.workerNodeIpAddresses ?? []

        workerNodeIpAddresses[name.split('.')[1]] = value
        onChange({
          ...prevValue,
          workerNodeIpAddresses,
        })
      },
      toggleStaticIpAddress(__, ev) {
        const { name } = ev.target
        const { onChange, value: prevValue } = this.props
        onChange({
          ...prevValue,
          [name]: ev.target.checked,
        })
      },
    },
    computed: {
      networkPredicate:
        (_, { value: { pool } }) =>
        network =>
          pool.id === network.$pool,
      srPredicate:
        (_, { value }) =>
        sr =>
          sr.$pool === get(() => value.pool.id) && isSrWritable(sr),
    },
  }),
  injectState,
  ({ effects, install, intl: { formatMessage }, state, value }) => (
    <Container>
      <FormGrid.Row>
        <label>{_('vmImportToPool')}</label>
        <SelectPool className='mb-1' onChange={effects.onChangePool} required value={value.pool} />
      </FormGrid.Row>
      <FormGrid.Row>
        <label>{_('vmImportToSr')}</label>
        <SelectSr onChange={effects.onChangeSr} predicate={state.srPredicate} required value={value.sr} />
      </FormGrid.Row>
      <FormGrid.Row>
        <label>{_('network')}</label>
        <SelectNetwork
          className='mb-1'
          onChange={effects.onChangeNetwork}
          required
          value={value.network}
          predicate={state.networkPredicate}
        />
      </FormGrid.Row>
      <FormGrid.Row>
        <label>{_('recipeMasterNameLabel')}</label>
        <input
          className='form-control'
          name='masterName'
          onChange={effects.onChangeValue}
          placeholder={formatMessage(messages.recipeMasterNameLabel)}
          required
          type='text'
          value={value.masterName}
        />
      </FormGrid.Row>
      <FormGrid.Row>
        <label>{_('recipeNumberOfNodesLabel')}</label>
        <input
          className='form-control'
          name='nbNodes'
          min='1'
          onChange={effects.onChangeValue}
          placeholder={formatMessage(messages.recipeNumberOfNodesLabel)}
          required
          type='number'
          value={value.nbNodes}
        />
      </FormGrid.Row>
      <FormGrid.Row>
        <label>
          <input
            className='mt-1'
            name='staticIpAddress'
            onChange={effects.toggleStaticIpAddress}
            type='checkbox'
            value={value.staticIpAddress}
          />
          &nbsp;
          {_('recipeStaticIpAddresses')}
        </label>
      </FormGrid.Row>
      {value.nbNodes > 0 &&
        value.staticIpAddress && [
          <FormGrid.Row key='masterIpAddrRow'>
            <label>{_('recipeMasterIpAddress')}</label>
            <input
              className='form-control'
              name='masterIpAddress'
              onChange={effects.onChangeValue}
              placeholder={formatMessage(messages.recipeMasterIpAddress)}
              required
              type='text'
              value={value.masterIpAddress}
            />
          </FormGrid.Row>,
          <FormGrid.Row key='netmaskRow'>
            <label>{_('recipeNetworkMask')}</label>
            <input
              className='form-control'
              name='networkMask'
              onChange={effects.onChangeValue}
              placeholder={formatMessage(messages.recipeNetworkMask)}
              required
              type='text'
              value={value.networkMask}
            />
          </FormGrid.Row>,
          <FormGrid.Row key='gatewayRow'>
            <label>{_('recipeGatewayIpAddress')}</label>
            <input
              className='form-control'
              name='gatewayIpAddress'
              onChange={effects.onChangeValue}
              placeholder={formatMessage(messages.recipeGatewayIpAddress)}
              required
              type='text'
              value={value.gatewayIpAddress}
            />
          </FormGrid.Row>,
          [...Array(+value.nbNodes)].map((v, i) => (
            <FormGrid.Row key={v}>
              <label>{_('recipeWorkerIpAddress', { i: i + 1 })}</label>
              <input
                className='form-control'
                name={`workerNodeIpAddress.${i}`}
                onChange={effects.onChangeWorkerIp}
                placeholder={formatMessage(messages.recipeWorkerIpAddress, { i: i + 1 })}
                required
                type='text'
                value={value[`workerNodeIpAddress.${i}`]}
              />
            </FormGrid.Row>
          )),
        ]}
      <FormGrid.Row>
        <label>{_('recipeSshKeyLabel')}</label>
        <input
          className='form-control'
          name='sshKey'
          onChange={effects.onChangeValue}
          placeholder={formatMessage(messages.recipeSshKeyLabel)}
          required
          type='text'
          value={value.sshKey}
        />
      </FormGrid.Row>
    </Container>
  ),
])
