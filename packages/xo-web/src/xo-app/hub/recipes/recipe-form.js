import * as FormGrid from 'form-grid'
import _, { messages } from 'intl'
import decorate from 'apply-decorators'
import React from 'react'
import { Container } from 'grid'
import { compareVersions } from 'compare-versions'
import { createLogger } from '@xen-orchestra/log'
import { get } from '@xen-orchestra/defined'
import { injectIntl } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { isSrWritable } from 'xo'
import { SelectPool, SelectNetwork, SelectSr } from 'select-objects'
import { Select } from 'form'

const logger = createLogger('kubernetes-recipe')

const FAULT_TOLERANCE = [
  {
    label: _('recipeNoneFaultTolerance'),
    value: 0,
  },
  {
    label: _('recipeOneFaultTolerance'),
    value: 1,
  },
  {
    label: _('recipeTwoFaultTolerance'),
    value: 2,
  },
  {
    label: _('recipeThreeFaultTolerance'),
    value: 3,
  },
]

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
      onChangeFaultTolerance(__, faultTolerance) {
        const { onChange, value } = this.props
        onChange({
          ...value,
          faultTolerance: faultTolerance.value,
          // n * 2 + 1 is the formula to meet the quorum of RAFT consensus algorithm
          controlPlanePoolSize: faultTolerance.value * 2 + 1,
        })
      },
      onChangeK8sVersion(__, k8sVersion) {
        const { onChange, value } = this.props
        onChange({
          ...value,
          k8sVersion: k8sVersion.value,
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
      onChangeCpIp(__, ev) {
        const { name, value } = ev.target
        const { onChange, value: prevValue } = this.props
        const controlPlaneIpAddresses = prevValue.controlPlaneIpAddresses ?? []

        controlPlaneIpAddresses[name.split('.')[1]] = value
        onChange({
          ...prevValue,
          controlPlaneIpAddresses,
        })
      },
      onChangeNameserver(__, ev) {
        const { value } = ev.target
        const { onChange, value: prevValue } = this.props
        const nameservers = value.split(',').map(nameserver => nameserver.trim())
        onChange({
          ...prevValue,
          nameservers,
        })
      },
      onChangeSearch(__, ev) {
        const input = ev.target.value.trim()
        const { onChange, value: prevValue } = this.props
        onChange({
          ...prevValue,
          searches: input.length === 0 ? undefined : input.split(',').map(search => search.trim()),
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
      versionList: async () => {
        const res = await fetch('https://api.github.com/repos/canonical/microk8s/releases')
        if (res.ok) {
          const rawList = await res.json()
          const versionList = rawList
            .filter(version => !version.prerelease)
            .map(({ tag_name }) => ({
              label: tag_name,
              value: tag_name.slice(1),
            }))
            .sort(({ value: a }, { value: b }) => -compareVersions(a, b))
          return versionList
        } else {
          logger.error('HTTP response: ' + res.status)
        }
      },
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
        <label>{_('recipeSelectK8sVersion')}</label>
        <Select
          className='mb-1'
          name='k8sVersion'
          onChange={effects.onChangeK8sVersion}
          options={state.versionList}
          required
          value={value.k8sVersion}
        />
      </FormGrid.Row>
      <FormGrid.Row>
        <label>{_('recipeClusterNameLabel')}</label>
        <input
          className='form-control'
          name='clusterName'
          onChange={effects.onChangeValue}
          placeholder={formatMessage(messages.recipeClusterNameLabel)}
          required
          type='text'
          value={value.clusterName}
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
        <label>{_('recipeFaultTolerance')}</label>
        <Select
          className='mb-1'
          name='faultTolerance'
          onChange={effects.onChangeFaultTolerance}
          options={FAULT_TOLERANCE}
          required
          value={value.faultTolerance}
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
          value.faultTolerance > 0
            ? [
                Array.from({ length: value.controlPlanePoolSize }).map((v, i) => (
                  <FormGrid.Row key={i}>
                    <label>{_('recipeHaControlPlaneIpAddress', { i: i + 1 })}</label>
                    <input
                      className='form-control'
                      name={`controlPlaneIpAddress.${i}`}
                      onChange={effects.onChangeCpIp}
                      placeholder={formatMessage(messages.recipeHaControlPlaneIpAddress, { i: i + 1 })}
                      required
                      type='text'
                      value={value[`controlPlaneIpAddress.${i}`]}
                    />
                  </FormGrid.Row>
                )),
                <FormGrid.Row key='vipAddrRow'>
                  <label>{_('recipeVip')}</label>
                  <input
                    className='form-control'
                    name='vipAddress'
                    onChange={effects.onChangeValue}
                    placeholder={formatMessage(messages.recipeVip)}
                    required
                    type='text'
                    value={value.vipAddress}
                  />
                </FormGrid.Row>,
              ]
            : [
                <FormGrid.Row key='controlPlaneIpAddrRow'>
                  <label>{_('recipeControlPlaneIpAddress')}</label>
                  <input
                    className='form-control'
                    name='controlPlaneIpAddress'
                    onChange={effects.onChangeValue}
                    placeholder={formatMessage(messages.recipeControlPlaneIpAddress)}
                    required
                    type='text'
                    value={value.controlPlaneIpAddress}
                  />
                </FormGrid.Row>,
              ],
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
          <FormGrid.Row key='nameserverRow'>
            <label>{_('recipeNameserverAddresses')}</label>
            <input
              className='form-control'
              name='nameservers'
              onChange={effects.onChangeNameserver}
              placeholder={formatMessage(messages.recipeNameserverAddressesExample)}
              required
              type='text'
              value={value.nameservers}
            />
          </FormGrid.Row>,
          <FormGrid.Row key='searchRow'>
            <label>{_('recipeSearches')}</label>
            <input
              className='form-control'
              name='search'
              onChange={effects.onChangeSearch}
              placeholder={formatMessage(messages.recipeSearchesExample)}
              type='text'
              value={value.search}
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
