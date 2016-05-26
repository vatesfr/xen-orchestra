import ActionButton from 'action-button'
import find from 'lodash/find'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import Link from 'react-router/lib/Link'
import map from 'lodash/map'
import orderBy from 'lodash/orderBy'
import React, { Component } from 'react'
import size from 'lodash/size'
import { connectStore, formatSize } from 'utils'
import { createGetObject, createGetObjectsOfType } from 'selectors'
import { DropdownButton, MenuItem } from 'react-bootstrap-4/lib'
import { info, error } from 'notification'
import { FormattedDate } from 'react-intl'
import { Row, Col } from 'grid'

import {
  importBackup,
  importDeltaBackup,
  listRemote,
  subscribeRemotes
} from 'xo'

const deltaBuilder = (backups, uuid, name, tag, value) => {
  let deltaBackup = backups[uuid]
    ? backups[uuid]
    : backups[uuid] = {}

  deltaBackup = deltaBackup[name]
    ? deltaBackup[name]
    : deltaBackup[name] = {}

  deltaBackup = deltaBackup[tag]
    ? deltaBackup[tag]
    : deltaBackup[tag] = []

  deltaBackup.push(value)
}

const isEmptyRemote = remote => !remote.backups || !(size(remote.backups.delta) || size(remote.backups.other))

@connectStore(() => {
  const object = createGetObject((_, props) => props.id)
  return (state, props) => ({object: object(state, props)})
})
class ObjectName extends Component {
  render () {
    const { object } = this.props
    return <span>{object && object.name_label}</span>
  }
}

@connectStore(() => {
  const writableSrs = createGetObjectsOfType('SR').filter(
    [ sr => sr.content_type !== 'iso' ]
  ).sort()
  return (state, props) => {
    return { writableSrs: writableSrs(state, props) }
  }
})
export default class Restore extends Component {
  constructor (props) {
    super(props)
    this.state = {
      remotes: []
    }
  }

  componentWillMount () {
    this.componentWillUnmount = subscribeRemotes(rawRemotes => {
      const { remotes } = this.state
      forEach(remotes, r => {
        if (r.backups) {
          const freshRemote = find(rawRemotes, {id: r.id})
          freshRemote && (freshRemote.backups = r.backups)
        }
      })
      this.setState({
        remotes: orderBy(rawRemotes, ['name'])
      })
    })
  }

  _list = async id => {
    try {
      const files = await listRemote(id)
      const { remotes } = this.state
      const remote = find(remotes, {id})
      if (remote) {
        const backups = remote.backups = {
          delta: {},
          other: []
        }

        forEach(files, file => {
          const arr = /^vm_delta_(.*)_([^\/]+)\/([^_]+)_(.*)$/.exec(file)

          if (arr) {
            const [ , tag, uuid, date, name ] = arr
            const value = {
              path: file,
              date
            }
            deltaBuilder(backups.delta, uuid, name, tag, value)
          } else {
            backups.other.push(file)
          }
        })
      }
      this.setState({remotes})
    } catch (err) {
      console.log(err)
      error('List Remote', err.message || String(err))
    }
  }

  _notifyImportStart () {
    info('VM import', 'Starting your backup import')
  }

  _importDeltaBackup = (remote, sr, filePath) => {
    this._notifyImportStart()
    importDeltaBackup({remote, sr, filePath})
  }

  _importBackup = (remote, sr, file) => {
    this._notifyImportStart()
    importBackup({remote, sr, file})
  }

  render () {
    const {
      remotes
    } = this.state

    const {
      writableSrs
    } = this.props

    return (
      <div>
        <h1>Restore</h1>
        {!remotes.length && <span>No remotes</span>}
        {map(remotes, (r, key) =>
          <div key={key}>
            <p>
              <Link to='settings/remotes'>{r.name}</Link>
              {' '}
              {r.enabled && <span className='tag tag-success'>enabled</span>}
              {r.error && <span className='text-danger'> (on error)</span>}
              <span className='pull-right'>
                <ActionButton disabled={!r.enabled} icon='refresh' btnStyle='default' handler={this._list} handlerParam={r.id} />
              </span>
              {r.backups &&
                <div>
                  {isEmptyRemote(r) && <span>No backups available</span>}
                  {map(r.backups.delta, (backups, uuid) =>
                    <Row key={uuid}>
                      <Col smallSize={2}>{uuid}</Col>
                      <Col smallSize={10}>
                        {map(backups, (backups, name) =>
                          <Row key={name}>
                            <Col smallSize={2}>{name}</Col>
                            <Col smallSize={10}>
                              {map(backups, (backups, tag) =>
                                <Row key={tag}>
                                  <Col smallSize={2}>{tag}</Col>
                                  <Col smallSize={10}>
                                    {map(backups, (b, k) =>
                                      <div key={k}>
                                        <FormattedDate value={new Date(+b.date)} month='long' day='numeric' year='numeric' hour='2-digit' minute='2-digit' second='2-digit' />
                                        {' '}
                                        <DropdownButton id='filter' bsStyle='info' title='Import'>
                                          {map(writableSrs, (sr, key) =>
                                            <MenuItem key={key} onClick={this._importDeltaBackup}>
                                              <Icon icon='sr' />
                                              To {sr.name_label} ({formatSize(sr.size - sr.physical_usage)})
                                              <ObjectName id={sr.$container} />
                                            </MenuItem>
                                          )}
                                        </DropdownButton>
                                      </div>
                                    )}
                                  </Col>
                                </Row>
                              )}
                            </Col>
                          </Row>
                        )}
                      </Col>
                    </Row>
                  )}
                  {map(r.backups.other, (b, k) =>
                    <p key={k}>
                      {b}
                      {' '}
                      <DropdownButton id='filter' bsStyle='info' title='Import'>
                        {map(writableSrs, (sr, key) =>
                          <MenuItem key={key} onClick={this._importBackup}>
                            <Icon icon='sr' /> To {sr.name_label} ({formatSize(sr.size - sr.physical_usage)}) <ObjectName id={sr.$container} />
                          </MenuItem>
                        )}
                      </DropdownButton>
                    </p>
                  )}
                </div>
              }
            </p>
            <hr />
          </div>
        )}
      </div>
      )
  }
}
