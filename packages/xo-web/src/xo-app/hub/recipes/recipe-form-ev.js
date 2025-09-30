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
import { Select } from 'form'
import TimezonePicker from '../../../common/timezone-picker'

const PERF_CONFIG = [
  {
    label: _('dcScopeTest'),
    value: 0,
  },
  {
    label: _('dcScopeVerySmall'),
    value: 1,
  },
  {
    label: _('dcScopeSmall'),
    value: 2,
  },
  {
    label: _('dcScopeMedium'),
    value: 3,
  },
  {
    label: _('dcScopeBig'),
    value: 4,
  },
  {
    label: _('dcScopeVeryBig'),
    value: 5,
  },
  {
    label: _('dcScopeHuge'),
    value: 6,
  },
]

const EASYVIRT_VM = [
  {
    label: _('dcScopeVm'),
    value: 'dcScope',
  },
  {
    label: _('dcNetScopeVm'),
    value: 'dcNetScope',
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
      onChangeValue(__, valueOrEvent, fieldName) {
        const { onChange, value: prevValue } = this.props

        if (fieldName) {
          const updates = { fieldName: valueOrEvent }
          onChange({
            ...prevValue,
            ...updates,
          })
        } else {
          const { name, value } = valueOrEvent.target
          const { onChange, value: prevValue } = this.props
          onChange({
            ...prevValue,
            [name]: value,
          })
        }
      },
      onChangePerformanceIndex(__, performanceIndex) {
        const { onChange, value } = this.props
        onChange({
          ...value,
          performanceIndex: performanceIndex.value,
        })
      },
      onChangeEasyVirtTemplateName(__, productName) {
        const { onChange, value } = this.props
        onChange({
          ...value,
          productName: productName.value,
        })
      },
      toggleValue(__, ev) {
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
  ({ effects, intl: { formatMessage }, state, value }) => (
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
        <label>
          <input
            className='mt-1'
            name='staticIpAddress'
            onChange={effects.toggleValue}
            type='checkbox'
            value={value.staticIpAddress}
          />
          &nbsp;
          {_('recipeStaticIpAddress')}
        </label>
      </FormGrid.Row>
      {value.staticIpAddress && [
        <FormGrid.Row key='vmIpAddrRow'>
          <label>{_('staticIp')}</label>
          <input
            className='form-control'
            name='vmIpAddress'
            onChange={effects.onChangeValue}
            placeholder={formatMessage(messages.staticIp)}
            required
            type='text'
            value={value.vmIpAddress}
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
      ]}
      <FormGrid.Row>
        <label>{_('vmNameCompleteLabel')}</label>
        <input
          className='form-control'
          name='vmName'
          onChange={effects.onChangeValue}
          placeholder={formatMessage(messages.vmNameCompleteLabel)}
          required
          type='text'
          value={value.vmName}
        />
      </FormGrid.Row>
      <FormGrid.Row>
        <label>{_('selectTimezone')}</label>
        <TimezonePicker value={value.timezone} onChange={timezone => effects.onChangeValue(timezone, 'timezone')} />
      </FormGrid.Row>
      <FormGrid.Row>
        <label>
          <input
            className='mt-1'
            name='bootAfterCreate'
            onChange={effects.toggleValue}
            type='checkbox'
            value={value.bootAfterCreate}
          />
          &nbsp;
          {_('newVmBootAfterCreate')}
        </label>
      </FormGrid.Row>
      <FormGrid.Row>
        <label>{_('xoUsername')}</label>
        <input
          className='form-control'
          name='xoUsername'
          onChange={effects.onChangeValue}
          placeholder={formatMessage(messages.xoUsername)}
          required
          type='text'
          value={value.xoUsername}
        />
      </FormGrid.Row>
      <FormGrid.Row>
        <label>{_('xoPassword')}</label>
        <input
          className='form-control'
          name='xoPassword'
          onChange={effects.onChangeValue}
          placeholder={formatMessage(messages.xoPassword)}
          required
          type='password'
          value={value.xoPassword}
        />
      </FormGrid.Row>
      <FormGrid.Row>
        <label>{_('xoFqdn')}</label>
        <input
          className='form-control'
          name='xoUrl'
          onChange={effects.onChangeValue}
          placeholder='xoa.local'
          required
          type='text'
          value={value.xoUrl}
        />
      </FormGrid.Row>
      <FormGrid.Row>
        <label>{_('recipeEasyVirt')}</label>
        <Select
          className='mb-1'
          name='productName'
          onChange={effects.onChangeEasyVirtTemplateName}
          options={EASYVIRT_VM}
          required
          value={value.productName}
        />
      </FormGrid.Row>
      {value.productName === 'dcScope' && (
        <FormGrid.Row>
          <label>{_('performanceConfigDcScope')}</label>
          <Select
            className='mb-1'
            name='performanceIndex'
            onChange={effects.onChangePerformanceIndex}
            options={PERF_CONFIG}
            required
            value={value.performanceIndex}
          />
        </FormGrid.Row>
      )}
      <FormGrid.Row>
        <label>{_('recipeUserEmail')}</label>
        <input
          className='form-control'
          name='userEmail'
          onChange={effects.onChangeValue}
          placeholder={formatMessage(messages.emailPlaceholderExample)}
          required
          type='text'
          value={value.userEmail}
        />
      </FormGrid.Row>
      <FormGrid.Row>
        <label>{_('recipeUserCompany')}</label>
        <input
          className='form-control'
          name='userCompany'
          onChange={effects.onChangeValue}
          placeholder={formatMessage(messages.recipeUserCompany)}
          required
          type='text'
          value={value.userCompany}
        />
      </FormGrid.Row>
      <FormGrid.Row>
        <label>
          <input
            className='mt-1'
            name='gdpr'
            onChange={effects.toggleValue}
            required
            type='checkbox'
            value={value.gdpr}
          />
          &nbsp;
          {_('gdprCompliance')}
        </label>
      </FormGrid.Row>
    </Container>
  ),
])
