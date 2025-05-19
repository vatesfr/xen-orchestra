import * as ComplexMatcher from 'complex-matcher'
import _ from 'intl'
import ActionButton from 'action-button'
import ActionToggle from 'action-toggle'
import Button from 'button'
import Component from 'base-component'
import decorate from 'apply-decorators'
import escapeRegExp from 'lodash/escapeRegExp'
import GenericInput from 'json-schema-input'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import Link from 'link'
import map from 'lodash/map'
import merge from 'lodash/merge'
import orderBy from 'lodash/orderBy'
import pFinally from 'promise-toolbox/finally'
import React from 'react'
import size from 'lodash/size'
import { addSubscriptions } from 'utils'
import { alert } from 'modal'
import { createSelector } from 'reselect'
import { generateUiSchema } from 'xo-json-schema-input'
import { get } from '@xen-orchestra/defined'
import { injectState, provideState } from 'reaclette'
import { Row, Col } from 'grid'
import {
  configurePlugin,
  disablePluginAutoload,
  enablePluginAutoload,
  loadPlugin,
  purgePluginConfiguration,
  subscribePlugins,
  testPlugin,
  unloadPlugin,
} from 'xo'

class Plugin extends Component {
  constructor(props) {
    super(props)

    this.configFormId = `form-config-${props.id}`
    this.testFormId = `form-test-${props.id}`
  }

  _getPluginLink = createSelector(
    () => this.props.name,
    name => {
      const s = new ComplexMatcher.Property(
        'name',
        new ComplexMatcher.RegExp('^' + escapeRegExp(name) + '$')
      ).toString()
      return location => ({ ...location, query: { ...location.query, s } })
    }
  )

  _getUiSchema = createSelector(() => this.props.configurationSchema, generateUiSchema)

  _updateExpanded = () => {
    this.setState({
      expanded: !this.state.expanded,
    })
  }

  _setAutoload = event => {
    if (this._updateAutoload) {
      return
    }

    this._updateAutoload = true

    const method = event.target.checked ? enablePluginAutoload : disablePluginAutoload
    method(this.props.id)::pFinally(() => {
      this._updateAutoload = false
    })
  }

  _updateLoad = () => {
    const { props } = this
    const { id } = props

    if (!props.loaded) {
      enablePluginAutoload(id).catch(console.warn)
      return loadPlugin(id)
    }
    if (props.unloadable !== false) {
      disablePluginAutoload(id).catch(console.warn)
      return unloadPlugin(id)
    }
  }

  _saveConfiguration = async () => {
    await configurePlugin(this.props.id, this.state.editedConfig)
    this._stopEditing()
  }

  _deleteConfiguration = async () => {
    await purgePluginConfiguration(this.props.id)
    this._stopEditing()
  }

  _stopEditing = event => {
    event && event.preventDefault()

    this.setState({
      editedConfig: undefined,
    })
  }

  _applyPredefinedConfiguration = () => {
    const configName = this.refs.selectPredefinedConfiguration.value
    this.setState({
      editedConfig: merge(undefined, this.state.editedConfig, this.props.configurationPresets[configName]),
    })
  }

  _test = async () => {
    try {
      const { testInput } = this.refs
      await testPlugin(this.props.id, testInput && testInput.value)
      alert(_('pluginTest'), <p>{_('pluginConfirmation')}</p>)
    } catch (err) {
      await alert(
        'You have an error!',
        <div>
          <p>Code: {err.code}</p>
          <p>Message: {err.message}</p>
          {err.data && <pre>{JSON.stringify(err.data, null, 2)}</pre>}
        </div>
      )
      throw err
    }
  }

  render() {
    const { props, state } = this
    const { editedConfig, expanded } = state
    const { configurationPresets, configurationSchema, loaded } = props
    const description = get(() => props.description.trim())

    return (
      <div className='card-block'>
        <Row>
          <Col mediumSize={8}>
            <h5 className='form-inline clearfix'>
              <ActionToggle disabled={loaded && props.unloadable === false} handler={this._updateLoad} value={loaded} />{' '}
              <Link to={this._getPluginLink()}>{props.name}</Link> <span>{`(v${props.version}) `}</span>
              {description !== undefined && description !== '' && (
                <span className='text-muted small'> - {description}</span>
              )}
              <div className='checkbox small'>
                <label className='text-muted'>
                  {_('autoloadPlugin')} <input type='checkbox' checked={props.autoload} onChange={this._setAutoload} />
                </label>
              </div>
            </h5>
          </Col>
          {configurationSchema !== undefined && (
            <Col className='text-xs-right' mediumSize={4}>
              <Button btnStyle='primary' onClick={this._updateExpanded}>
                <Icon icon={expanded ? 'minus' : 'plus'} />
              </Button>
            </Col>
          )}
        </Row>
        {expanded && (
          <form id={this.configFormId} onReset={this._stopEditing}>
            {size(configurationPresets) > 0 && (
              <div>
                <legend>{_('pluginConfigurationPresetTitle')}</legend>
                <span className='text-muted'>
                  <p>{_('pluginConfigurationChoosePreset')}</p>
                </span>
                <div className='input-group'>
                  <select className='form-control' ref='selectPredefinedConfiguration'>
                    {map(configurationPresets, (_, name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <span className='input-group-btn'>
                    <Button btnStyle='primary' onClick={this._applyPredefinedConfiguration}>
                      {_('applyPluginPreset')}
                    </Button>
                  </span>
                </div>
                <hr />
              </div>
            )}
            <GenericInput
              label='Configuration'
              required
              schema={configurationSchema}
              uiSchema={this._getUiSchema()}
              onChange={this.linkState('editedConfig')}
              value={editedConfig || props.configuration}
            />
            <div className='form-group pull-right'>
              <div className='btn-toolbar'>
                <div className='btn-group'>
                  <ActionButton
                    btnStyle='danger'
                    disabled={!props.configuration}
                    handler={this._deleteConfiguration}
                    icon='delete'
                  >
                    {_('deletePluginConfiguration')}
                  </ActionButton>
                </div>
                <div className='btn-group'>
                  <Button disabled={!editedConfig} type='reset'>
                    {_('cancelPluginEdition')}
                  </Button>
                </div>
                <div className='btn-group'>
                  <ActionButton
                    btnStyle='primary'
                    disabled={!editedConfig}
                    form={this.configFormId}
                    handler={this._saveConfiguration}
                    icon='save'
                  >
                    {_('savePluginConfiguration')}
                  </ActionButton>
                </div>
              </div>
            </div>
          </form>
        )}
        {expanded && props.testable && (
          <form id={this.testFormId}>
            {props.testSchema && (
              <GenericInput
                label='Test data'
                schema={props.testSchema}
                uiSchema={generateUiSchema(props.testSchema)}
                required
                ref='testInput'
              />
            )}
            <div className='form-group pull-right'>
              <ActionButton
                btnStyle='primary'
                disabled={!loaded}
                form={this.testFormId}
                handler={this._test}
                icon='diagnosis'
                tooltip={loaded ? undefined : _('disabledTestPluginTooltip')}
              >
                Test plugin
              </ActionButton>
            </div>
          </form>
        )}
      </div>
    )
  }
}

export default decorate([
  addSubscriptions({
    plugins: subscribePlugins,
  }),
  provideState({
    effects: {
      onSearchChange(_, { target: { value } }) {
        const { location, router } = this.props
        router.replace({
          ...location,
          query: {
            ...location.query,
            s: value,
          },
        })
      },
    },
    computed: {
      search: (
        _,
        {
          location: {
            query: { s = '' },
          },
        }
      ) => s,
      filteredPlugins: ({ predicate }, { plugins }) => (predicate === undefined ? plugins : plugins.filter(predicate)),
      predicate: ({ search }) => {
        if (search.trim() === '') {
          return
        }

        try {
          return ComplexMatcher.parse(search).createPredicate()
        } catch (error) {
          console.warn(error)
        }
      },
      sortedPlugins: ({ filteredPlugins }) => orderBy(filteredPlugins, 'name'),
    },
  }),
  injectState,
  ({ effects, state, plugins }) =>
    isEmpty(plugins) ? (
      <p>
        <em>{_('noPlugins')}</em>
      </p>
    ) : (
      <div>
        <p>
          <input className='form-control' onChange={effects.onSearchChange} value={state.search} />
        </p>
        <span>
          {_('homeDisplayedItems', {
            displayed: state.sortedPlugins.length,
            icon: <Icon icon='plugin' />,
            total: plugins.length,
          })}
        </span>
        <ul style={{ paddingLeft: 0 }}>
          {state.sortedPlugins.map(plugin => (
            <li key={plugin.id} className='list-group-item clearfix'>
              <Plugin {...plugin} />
            </li>
          ))}
        </ul>
      </div>
    ),
])
