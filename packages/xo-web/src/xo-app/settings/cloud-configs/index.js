import _ from 'intl'
import ActionButton from 'action-button'
import decorate from 'apply-decorators'
import defined from '@xen-orchestra/defined'
import React from 'react'
import SortedTable from 'sorted-table'
import { addSubscriptions } from 'utils'
import { AvailableTemplateVars, DEFAULT_CLOUD_CONFIG_TEMPLATE, DEFAULT_NETWORK_CONFIG_TEMPLATE } from 'cloud-config'
import { Container, Col } from 'grid'
import find from 'lodash/find.js'
import { generateId } from 'reaclette-utils'
import { injectState, provideState } from 'reaclette'
import { Text } from 'editable'
import { Textarea as DebounceTextarea } from 'debounce-input-decorator'
import {
  createCloudConfig,
  createNetworkConfig,
  deleteCloudConfigs,
  deleteNetworkConfigs,
  editCloudConfig,
  editNetworkConfig,
  subscribeCloudConfigs,
  subscribeNetworkConfigs,
} from 'xo'

// ===================================================================

const COLUMNS = [
  {
    itemRenderer: _ => _.id.slice(4, 8),
    name: _('formId'),
    sortCriteria: _ => _.id.slice(4, 8),
  },
  {
    itemRenderer: ({ id, name }) => <Text value={name} onChange={name => editCloudConfig(id, { name })} />,
    sortCriteria: 'name',
    name: _('formName'),
    default: true,
  },
]

const ACTIONS = [
  {
    handler: (ids, { type }) => (type === 'network' ? deleteNetworkConfigs(ids) : deleteCloudConfigs(ids)),
    icon: 'delete',
    individualLabel: _('deleteCloudConfig'),
    label: _('deleteSelectedCloudConfigs'),
    level: 'danger',
  },
]

const INDIVIDUAL_ACTIONS = [
  {
    handler: (cloudConfig, { populateForm }) => populateForm(cloudConfig),
    icon: 'edit',
    label: _('editCloudConfig'),
    level: 'primary',
  },
]

const initialParams = {
  cloudConfigToEditId: undefined,
  name: '',
  networkConfigToEditId: undefined,
  networkConfigName: '',
  networkConfigTemplate: undefined,
  template: undefined,
}

export default decorate([
  addSubscriptions({
    cloudConfigs: subscribeCloudConfigs,
    networkConfigs: subscribeNetworkConfigs,
  }),
  provideState({
    initialState: () => initialParams,
    effects: {
      setInputValue:
        (_, { target: { name, value } }) =>
        state => ({
          ...state,
          [name]: value,
        }),
      reset: () => state => ({
        ...state,
        cloudConfigToEditId: initialParams.cloudConfigToEditId,
        name: initialParams.name,
        template: initialParams.template,
      }),
      resetNetworkForm: () => state => ({
        ...state,
        networkConfigToEditId: initialParams.networkConfigToEditId,
        networkConfigName: initialParams.networkConfigName,
        networkConfigTemplate: initialParams.networkConfigTemplate,
      }),
      createCloudConfig:
        ({ reset }) =>
        async ({ name, template = DEFAULT_CLOUD_CONFIG_TEMPLATE }) => {
          await createCloudConfig({ name, template })
          reset()
        },
      createNetworkConfig:
        ({ resetNetworkForm }) =>
        async ({ networkConfigName, networkConfigTemplate = DEFAULT_NETWORK_CONFIG_TEMPLATE }) => {
          await createNetworkConfig({ name: networkConfigName, template: networkConfigTemplate })
          resetNetworkForm()
        },
      editCloudConfig:
        ({ reset }) =>
        async ({ name, template, cloudConfigToEditId }, { cloudConfigs }) => {
          const oldCloudConfig = find(cloudConfigs, { id: cloudConfigToEditId })
          if (oldCloudConfig.name !== name || oldCloudConfig.template !== template) {
            await editCloudConfig(cloudConfigToEditId, { name, template })
          }
          reset()
        },
      editNetworkConfig:
        ({ resetNetworkForm }) =>
        async ({ networkConfigName, networkConfigTemplate, networkConfigToEditId }, { networkConfigs }) => {
          const oldNetworkConfig = find(networkConfigs, { id: networkConfigToEditId })
          if (oldNetworkConfig.name !== networkConfigName || oldNetworkConfig.template !== networkConfigTemplate) {
            await editNetworkConfig(networkConfigToEditId, { name: networkConfigName, template: networkConfigTemplate })
          }
          resetNetworkForm()
        },
      populateNetworkForm:
        (_, { id, name, template }) =>
        state => ({
          ...state,
          networkConfigName: name,
          networkConfigToEditId: id,
          networkConfigTemplate: template,
        }),
      populateForm:
        (_, { id, name, template }) =>
        state => ({
          ...state,
          name,
          cloudConfigToEditId: id,
          template,
        }),
    },
    computed: {
      formId: generateId,
      inputNameId: generateId,
      inputTemplateId: generateId,
      isInvalid: ({ name, template }) => name.trim() === '' || (template !== undefined && template.trim() === ''),
      isNetworkInvalid: props =>
        props.networkConfigName.trim() === '' ||
        (props.networkConfigTemplate !== undefined && props.networkConfigTemplate.trim() === ''),
    },
  }),
  injectState,
  ({ cloudConfigs, effects, networkConfigs, state }) => (
    <div>
      <Container>
        <Col mediumSize={6}>
          <h2>{_('cloudConfig')}</h2>
          <form id={state.formId}>
            <div className='form-group'>
              <label htmlFor={state.inputNameId}>
                <strong>{_('formName')}</strong>{' '}
              </label>
              <input
                className='form-control'
                id={state.inputNameId}
                name='name'
                onChange={effects.setInputValue}
                type='text'
                value={state.name}
              />
            </div>{' '}
            <div className='form-group'>
              <label htmlFor={state.inputTemplateId}>
                <strong>{_('settingsCloudConfigTemplate')}</strong>{' '}
              </label>{' '}
              <AvailableTemplateVars />
              <DebounceTextarea
                className='form-control text-monospace'
                id={state.inputTemplateId}
                name='template'
                onChange={effects.setInputValue}
                rows={12}
                value={defined(state.template, DEFAULT_CLOUD_CONFIG_TEMPLATE)}
              />
            </div>{' '}
            {state.cloudConfigToEditId !== undefined ? (
              <ActionButton
                btnStyle='primary'
                disabled={state.isInvalid}
                form={state.formId}
                handler={effects.editCloudConfig}
                icon='edit'
              >
                {_('formEdit')}
              </ActionButton>
            ) : (
              <ActionButton
                btnStyle='success'
                disabled={state.isInvalid}
                form={state.formId}
                handler={effects.createCloudConfig}
                icon='add'
              >
                {_('formCreate')}
              </ActionButton>
            )}
            <ActionButton className='pull-right' handler={effects.reset} icon='cancel'>
              {_('formCancel')}
            </ActionButton>
          </form>
        </Col>
        <Col mediumSize={6}>
          <SortedTable
            actions={ACTIONS}
            collection={cloudConfigs}
            columns={COLUMNS}
            data-populateForm={effects.populateForm}
            individualActions={INDIVIDUAL_ACTIONS}
            stateUrlParam='s'
          />
        </Col>
      </Container>
      <Container className='mt-2'>
        <Col mediumSize={6}>
          <h2>{_('networkConfig')}</h2>
          <form>
            <div className='form-group'>
              <label>
                <strong>{_('formName')}</strong>
              </label>
              <input
                className='form-control'
                name='networkConfigName'
                onChange={effects.setInputValue}
                type='text'
                value={state.networkConfigName}
              />
            </div>
            <div className='form-group'>
              <label htmlFor={state.inputTemplateId}>
                <strong>{_('settingsCloudConfigTemplate')}</strong>
              </label>
              <DebounceTextarea
                className='form-control text-monospace'
                id={state.inputTemplateId}
                name='networkConfigTemplate'
                onChange={effects.setInputValue}
                rows={12}
                value={defined(state.networkConfigTemplate, DEFAULT_NETWORK_CONFIG_TEMPLATE)}
              />
            </div>
            {state.networkConfigToEditId !== undefined ? (
              <ActionButton
                btnStyle='primary'
                disabled={state.isNetworkInvalid}
                handler={effects.editNetworkConfig}
                icon='edit'
              >
                {_('formEdit')}
              </ActionButton>
            ) : (
              <ActionButton
                btnStyle='success'
                disabled={state.isNetworkInvalid}
                handler={effects.createNetworkConfig}
                icon='add'
              >
                {_('formCreate')}
              </ActionButton>
            )}
            <ActionButton className='pull-right' handler={effects.resetNetworkForm} icon='cancel'>
              {_('formCancel')}
            </ActionButton>
          </form>
        </Col>
        <Col mediumSize={6}>
          <SortedTable
            actions={ACTIONS}
            collection={networkConfigs}
            columns={COLUMNS}
            data-populateForm={effects.populateNetworkForm}
            data-type='network'
            individualActions={INDIVIDUAL_ACTIONS}
            stateUrlParam='n'
          />
        </Col>
      </Container>
    </div>
  ),
])
