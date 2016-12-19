import _ from 'intl'
import Component from 'base-component'
import React from 'react'
import { noop } from 'utils'
import { FormattedDate } from 'react-intl'
import { SelectPlainObject } from 'form'
import {
  endsWith,
  findIndex,
  map
} from 'lodash'
import {
  scanDisk,
  scanFiles
} from 'xo'

import TreeSelect from 'rc-tree-select'

const TREE_SELECT_STYLE = { width: '100%' }
// tree-select dropdown's default z-index is 100 while react-bootstrap Modal's z-index is 1050
const TREE_SELECT_DROPDOWN_STYLE = { maxHeight: 200, overflow: 'auto', zIndex: 1100 }

const isFolder = ({ id }) => endsWith(id, '/')

// -----------------------------------------------------------------------------

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

const formatFilesOptions = (rawFiles, path) =>
  map(rawFiles, (file, name) => ({
    name,
    id: `${path}${name}`,
    content: file
  }))

// -----------------------------------------------------------------------------

const getNewTreeData = (tree, child, relativePath, folder = '/') => {
  if (/^\/*$/.exec(relativePath)) {
    return child
  }

  const match = /^\/*([^/]+\/)(.*)/.exec(relativePath)
  const subFolder = `${folder}${match[1]}`
  const index = findIndex(tree, file => file.key === subFolder)

  tree[index].children = getNewTreeData(tree[index].children, child, match[2], subFolder)

  return tree
}

// =============================================================================

export default class RestoreFileModalBody extends Component {
  get value () {
    const { state } = this

    return {
      disk: state.disk,
      partition: state.partition,
      paths: state.file && [ state.file.id ],
      remote: state.backup.remoteId
    }
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

    if (disk) {
      return scanDisk(this.state.backup.remoteId, disk).then(
        ({ partitions }) => {
          this.setState({
            partitions
          })
        },
        noop
      )
    }
  }

  _onPartitionChange = partition => {
    this.setState({
      partition,
      path: '/',
      file: undefined
    })

    if (partition) {
      return this._scanFiles('/', partition).then(
        files => this._updateTree(files)
      )
    }
  }

  _scanFiles = (path, partition = this.state.partition) => {
    const { backup, disk } = this.state

    return scanFiles(backup.remoteId, disk, partition, path).then(
      rawFiles => formatFilesOptions(rawFiles, path),
      noop
    )
  }

  _updateTree = (files, path = '/') => {
    const formattedFiles = map(files, file => ({
      isLeaf: !isFolder(file),
      key: file.id,
      label: file.name,
      selectable: !isFolder(file),
      value: file
    }))

    this.setState({
      tree: [ ...getNewTreeData(this.state.tree, formattedFiles, path) ]
    })
  }

  _onLoadData = node => {
    return this._scanFiles(node.props.eventKey).then(
      files => this._updateTree(files, node.props.eventKey),
      noop
    )
  }

  // ---------------------------------------------------------------------------

  render () {
    const { backups } = this.props
    const {
      backup,
      disk,
      file,
      partition,
      partitions,
      tree
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
      <br />
      <SelectPlainObject
        disabled={!backup}
        onChange={this._onDiskChange}
        optionKey='id'
        optionRenderer={diskOptionRenderer}
        options={backup && backup.disks}
        placeholder={_('restoreFilesSelectDisk')}
        value={disk}
      />
      <br />
      <SelectPlainObject
        disabled={!disk || !partitions}
        onChange={this._onPartitionChange}
        optionKey='id'
        optionRenderer={partitionOptionRenderer}
        options={partitions}
        placeholder={_('restoreFilesSelectPartition')}
        value={partition}
      />
      <br />
      <TreeSelect
        disabled={!partition}
        dropdownStyle={TREE_SELECT_DROPDOWN_STYLE}
        loadData={this._onLoadData}
        notFoundContent={_('restoreFileContentNotFound')}
        onSelect={this.linkState('file')}
        placeholder={_('restoreFilesSelectFiles')}
        showSearch={false}
        style={TREE_SELECT_STYLE}
        treeData={tree}
        treeLine
        treeNodeFilterProp='label'
        value={file}
      />
    </div>
  }
}
