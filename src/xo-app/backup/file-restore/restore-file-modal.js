import _ from 'intl'
import Component from 'base-component'
import endsWith from 'lodash/endsWith'
import map from 'lodash/map'
import React from 'react'
import replace from 'lodash/replace'
import { noop } from 'utils'
import { FormattedDate } from 'react-intl'
import { SelectPlainObject } from 'form'
import {
  scanDisk,
  scanFiles
} from 'xo'

const backupOptionRenderer = backup => <span>
  {backup.tag} - {backup.remoteName}
  {' '}
  (<FormattedDate value={new Date(backup.datetime)} month='long' day='numeric' year='numeric' hour='2-digit' minute='2-digit' second='2-digit' />)
</span>

const partitionOptionRenderer = partition => <span>
  {partition.name} {partition.type}
</span>

const diskOptionRenderer = disk => <span>
  {disk.name}
</span>

const fileOptionRenderer = file => <span>
  {file.name}
</span>

const formatFilesOptions = (rawFiles, root) => {
  const files = !root
    ? [{
      name: '..',
      id: '..',
      content: {}
    }]
    : []

  return files.concat(map(rawFiles, (file, name) => ({
    name,
    id: name,
    content: file
  })))
}

const getParentPath = path => replace(path, /^(\/+.+)*(\/+.+)/, '$1/')

// -----------------------------------------------------------------------------

export default class RestoreFileModalBody extends Component {
  get value () {
    const { state } = this

    return {
      disk: state.disk,
      partition: state.partition,
      paths: state.file && [ state.path + state.file.id ],
      remote: state.backup.remoteId
    }
  }

  _scanFiles = (path = this.state.path) => {
    const { backup, disk, partition } = this.state

    return scanFiles(backup.remoteId, disk, partition, path).then(
      rawFiles => {
        this.setState({
          files: formatFilesOptions(rawFiles, path === '/'),
          path
        })
      },
      noop
    )
  }

  _onBackupChange = backup => {
    this.setState({
      backup,
      disk: undefined,
      partition: undefined,
      file: undefined
    })
  }

  _onDiskChange = disk => {
    this.setState({
      disk,
      partition: undefined,
      file: undefined
    })

    if (!disk) {
      return
    }

    scanDisk(this.state.backup.remoteId, disk).then(
      ({ partitions }) => {
        this.setState({
          partitions
        })
      },
      noop
    )
  }

  _onPartitionChange = partition => {
    this.setState({
      partition,
      path: '/',
      file: undefined
    }, partition && this._scanFiles)
  }

  _onFileChange = file => {
    const { path } = this.state
    const isFile = file != null && file.id !== '..' && !endsWith(file.id, '/')

    this.setState({
      file: isFile ? file : undefined
    })

    if (isFile) {
      return
    }

    // Ugly workaround to keep the ReactSelect open after selecting a folder
    // FIXME: Remove and use isOpen/alwaysOpen prop once one of these issues is fixed:
    // https://github.com/JedWatson/react-select/issues/662 -> /pull/817
    // https://github.com/JedWatson/react-select/issues/962 -> /pull/1015
    const select = document.activeElement
    select.blur()
    select.focus()

    this._scanFiles(file.id === '..' ? getParentPath(path) : `${path}${file.id}`)
  }

  // ---------------------------------------------------------------------------

  render () {
    const { backups } = this.props
    const {
      backup,
      disk,
      file,
      files,
      partition,
      partitions,
      path
    } = this.state

    return <div>
      <SelectPlainObject
        onChange={this._onBackupChange}
        optionKey='id'
        optionRenderer={backupOptionRenderer}
        options={backups}
        placeholder={_('restoreFilesSelectBackup')}
        value={backup}
      />
      {backup && [
        <br />,
        <SelectPlainObject
          onChange={this._onDiskChange}
          optionKey='id'
          optionRenderer={diskOptionRenderer}
          options={backup.disks}
          placeholder={_('restoreFilesSelectDisk')}
          value={disk}
        />
      ]}
      {disk && partitions && [
        <br />,
        <SelectPlainObject
          onChange={this._onPartitionChange}
          optionKey='id'
          optionRenderer={partitionOptionRenderer}
          options={partitions}
          placeholder={_('restoreFilesSelectPartition')}
          value={partition}
        />
      ]}
      {partition && [
        <br />,
        <pre>{path}{file && file.id}</pre>,
        <SelectPlainObject
          onChange={this._onFileChange}
          optionKey='id'
          optionRenderer={fileOptionRenderer}
          options={files}
          placeholder={_('restoreFilesSelectFiles')}
          value={file}
        />
      ]}
    </div>
  }
}
