import _ from 'intl'
import ActionButton from 'action-button'
import decorate from 'apply-decorators'
import defined from '@xen-orchestra/defined'
import React from 'react'
import SortedTable from 'sorted-table'
import { addSubscriptions } from 'utils'
import { AvailableTemplateVars, DEFAULT_CLOUD_CONFIG_TEMPLATE, DEFAULT_NETWORK_CONFIG_TEMPLATE } from 'cloud-config'
import { Container, Col } from 'grid'
import { find } from 'lodash'
import { generateId } from 'reaclette-utils'
import { injectState, provideState } from 'reaclette'
import { Text } from 'editable'
import { Textarea as DebounceTextarea } from 'debounce-input-decorator'
import {
  createCloudConfig,
  createNetworkCloudConfig,
  deleteCloudConfigs,
  deleteNetworkCloudConfigs,
  editCloudConfig,
  editNetworkCloudConfig,
  subscribeCloudConfigs,
  subscribeNetworkCloudConfigs,
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
    handler: (ids, { type }) => (type === 'network' ? deleteNetworkCloudConfigs(ids) : deleteCloudConfigs(ids)),
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
  networkCloudConfigToEditId: undefined,
  networkName: '',
  networkTemplate: undefined,
  template: undefined,
}

export default decorate([
  addSubscriptions({
    cloudConfigs: subscribeCloudConfigs,
    networkConfigs: subscribeNetworkCloudConfigs,
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
        ...initialParams,
      }),
      createCloudConfig:
        ({ reset }) =>
        async ({ name, template = DEFAULT_CLOUD_CONFIG_TEMPLATE }) => {
          await createCloudConfig({ name, template })
          reset()
        },
      createNetworkCloudConfig:
        ({ reset }) =>
        async ({ networkName, networkTemplate = DEFAULT_NETWORK_CONFIG_TEMPLATE }) => {
          await createNetworkCloudConfig({ name: networkName, template: networkTemplate })
          reset()
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
      editNetworkCloudConfig:
        ({ reset }) =>
        async ({ networkName, networkTemplate, networkCloudConfigToEditId }, { cloudConfigs }) => {
          const oldCloudConfig = find(cloudConfigs, { id: networkCloudConfigToEditId })
          if (oldCloudConfig.name !== networkName || oldCloudConfig.template !== networkTemplate) {
            await editNetworkCloudConfig(networkCloudConfigToEditId, { name: networkName, template: networkTemplate })
          }
          reset()
        },
      populateForm:
        (_, { id, name, template, type }) =>
        state => ({
          ...state,
          [type === 'network' ? 'networkName' : 'name']: name,
          [type === 'network' ? 'networkCloudConfigToEditId' : 'cloudConfigToEditId']: id,
          [type === 'network' ? 'networkTemplate' : 'template']: template,
        }),
    },
    computed: {
      formId: generateId,
      inputNameId: generateId,
      inputTemplateId: generateId,
      isInvalid: ({ name, template }) => name.trim() === '' || (template !== undefined && template.trim() === ''),
      isNetworkValid: ({ networkName, networkTemplate }) =>
        networkName.trim() === '' || (networkTemplate !== undefined && networkTemplate.trim() === ''),
      userCloudConfig: (_, { cloudConfigs }) => cloudConfigs.filter(({ type }) => type === undefined),
    },
  }),
  injectState,
  ({ state, effects, networkConfigs }) => (
    <div>
      <Container>
        <Col mediumSize={6}>
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
            collection={state.userCloudConfig}
            columns={COLUMNS}
            data-populateForm={effects.populateForm}
            individualActions={INDIVIDUAL_ACTIONS}
            stateUrlParam='s'
          />
        </Col>
      </Container>
      <Container>
        <Col mediumSize={6}>
          <h2>Network template</h2>
          <form>
            <div className='form-group'>
              <label>
                <strong>{_('formName')}</strong>
              </label>
              <input
                className='form-control'
                name='networkName'
                onChange={effects.setInputValue}
                type='text'
                value={state.networkName}
              />
            </div>
            <div className='form-group'>
              <label htmlFor={state.inputTemplateId}>
                <strong>{_('settingsCloudConfigTemplate')}</strong>
              </label>
              <DebounceTextarea
                className='form-control text-monospace'
                id={state.inputTemplateId}
                name='networkTemplate'
                onChange={effects.setInputValue}
                rows={12}
                value={defined(state.networkTemplate, DEFAULT_NETWORK_CONFIG_TEMPLATE)}
              />
            </div>
            {state.networkCloudConfigToEditId !== undefined ? (
              <ActionButton
                btnStyle='primary'
                disabled={state.isNetworkValid}
                handler={effects.editNetworkCloudConfig}
                icon='edit'
              >
                {_('formEdit')}
              </ActionButton>
            ) : (
              <ActionButton
                btnStyle='success'
                disabled={state.isNetworkValid}
                handler={effects.createNetworkCloudConfig}
                icon='add'
              >
                {_('formCreate')}
              </ActionButton>
            )}
          </form>
        </Col>
        <Col mediumSize={6}>
          <SortedTable
            actions={ACTIONS}
            collection={networkConfigs}
            columns={COLUMNS}
            data-populateForm={effects.populateForm}
            data-type='network'
            individualActions={INDIVIDUAL_ACTIONS}
            stateUrlParam='s'
          />
        </Col>
      </Container>
    </div>
  ),
])
