import ActionButton from 'action-button'
import find from 'lodash/find'
import forEach from 'lodash/forEach'
import Link from 'react-router/lib/Link'
import map from 'lodash/map'
import moment from 'moment'
import orderBy from 'lodash/orderBy'
import React, { Component } from 'react'
import renderXoItem, { renderXoItemFromId } from 'render-xo-item'
import size from 'lodash/size'
import { connectStore, formatSize } from 'utils'
import { createGetObjectsOfType } from 'selectors'
import { DropdownButton, MenuItem } from 'react-bootstrap-4/lib'
import { FormattedDate } from 'react-intl'
import { info, error } from 'notification'
import { Container, Row, Col } from 'grid'
import Upgrade from 'xoa-upgrade'

import {
  importBackup,
  importDeltaBackup,
  listRemote,
  subscribeRemotes
} from 'xo'

/**
 * Groups backup files by tag, vmId
 */
const deltaBuilder = (backups, tag, id, value) => {
  let deltaBackup = backups[tag]
    ? backups[tag]
    : backups[tag] = {}

  deltaBackup = deltaBackup[id]
    ? deltaBackup[id]
    : deltaBackup[id] = []

  deltaBackup.push(value)
}

const isEmptyRemote = remote => !remote.backups || !(size(remote.backups.delta) || size(remote.backups.other))

@connectStore(() => ({
  writableSrs: createGetObjectsOfType('SR').filter(
    [ sr => sr.content_type !== 'iso' ]
  ).sort()
}))
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
      this.setState({
        remotes: orderBy(map(rawRemotes, r => {
          r = {...r}
          const older = find(remotes, {id: r.id})
          older && older.backups && (r.backups = older.backups)
          return r
        }), ['name'])
      })
    })
  }

  _list = async id => {
    let files
    try {
      files = await listRemote(id)
    } catch (err) {
      error('List Remote', err.message || String(err))
      return
    }
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
          const [ , tag, id, date, name ] = arr
          const value = {
            path: file,
            date: +moment(date, 'YYYYMMDDTHHmmssZ').format('x'),
            name
          }
          deltaBuilder(backups.delta, tag, id, value)
        } else {
          backups.other.push(file)
        }
      })

      forEach(remote.backups.delta, (byId, tag) => {
        forEach(byId, (bks, id) => {
          byId[id] = orderBy(bks, ['date'], ['asc'])
        })
      })
    }
    this.setState({remotes})
  }

  _notifyImportStart () {
    info('VM import', 'Starting your backup import')
  }

  _importDeltaBackup = async (remote, sr, filePath) => {
    this._notifyImportStart()
    try {
      await importDeltaBackup({remote, sr, filePath})
    } catch (err) {
      error('VM import', err.message || String(err))
    }
  }

  _importBackup = async (remote, sr, file) => {
    this._notifyImportStart()
    try {
      await importBackup({remote, sr, file})
    } catch (err) {
      error('VM import', err.message || String(err))
    }
  }

  render () {
    const {
      remotes
    } = this.state

    const {
      writableSrs
    } = this.props

    return process.env.XOA_PLAN > 1
      ? <Container>
        <h2>Restore Backups</h2>
        {!remotes.length && <span>No remotes</span>}
        {map(remotes, (r, key) =>
          <div key={key}>
            <Link to='/settings/remotes'>{r.name}</Link>
            {' '}
            {r.enabled && <span className='tag tag-success'>enabled</span>}
            {r.error && <span className='tag tag-danger'>on error</span>}
            <span className='pull-right'>
              <ActionButton disabled={!r.enabled} icon='refresh' btnStyle='default' handler={this._list} handlerParam={r.id} />
            </span>
            {r.backups &&
              <div>
                {isEmptyRemote(r) && <span>No backups available</span>}
                {map(r.backups.delta, (backups, tag) =>
                  <Row key={tag}>
                    <Col smallSize={2}>{tag}</Col>
                    <Col smallSize={10}>
                      {map(backups, (backups, id) =>
                        <div key={id} className='clearfix'>
                          {renderXoItemFromId(id)}
                          <span className='pull-right'>
                            {map(backups, (b, k) =>
                              <span key={k}>
                                <FormattedDate value={new Date(b.date)} month='long' day='numeric' year='numeric' hour='2-digit' minute='2-digit' second='2-digit' />
                                {' '}
                                <DropdownButton id='filter' bsStyle='info' title='Import to'>
                                  {map(writableSrs, (sr, key) =>
                                    <MenuItem key={key} onClick={() => this._importDeltaBackup(r.id, sr.id, b.path)}>
                                      {renderXoItem(sr)} ({formatSize(sr.size - sr.physical_usage)} free)
                                    </MenuItem>
                                  )}
                                </DropdownButton>
                                <br />
                                <br />
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </Col>
                  </Row>
                )}
                {map(r.backups.other, (b, k) =>
                  <div key={k}>
                    {b}
                    <span className='pull-right'>
                      <DropdownButton id='filter' bsStyle='info' title='Import to '>
                        {map(writableSrs, (sr, key) =>
                          <MenuItem key={key} onClick={() => this._importBackup(r.id, sr.id, b)}>
                            {renderXoItem(sr)} ({formatSize(sr.size - sr.physical_usage)} free)
                          </MenuItem>
                        )}
                      </DropdownButton>
                    </span>
                    <br />
                    <br />
                  </div>
                )}
              </div>
            }
            <hr />
          </div>
        )}
      </Container>
      : <Container><Upgrade place='restoreBackup' available={2} /></Container>
  }
}
