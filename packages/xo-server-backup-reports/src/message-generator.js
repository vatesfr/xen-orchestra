import { capitalize, groupBy } from 'lodash'

import { INDENT, STATUS_ICON, formatSize, formatSpeed } from './utils'

const handleOperationTask = (
  task,
  markdown,
  getTemporalDataMarkdown,
  vmSize
) => {
  const type = task.message
  if (type !== 'transfer' && type !== 'merge') {
    return
  }
  const size = task.result.size
  vmSize[type] === undefined && (vmSize[type] = size)
  markdown.push(
    `${INDENT.repeat(2)}- **${capitalize(type)}** ${STATUS_ICON.success}`,
    ...getTemporalDataMarkdown(task.start, task.end, 3),
    `${INDENT.repeat(3)}- **Size**: ${formatSize(size)}`,
    `${INDENT.repeat(3)}- **Speed**: ${formatSpeed(
      size,
      task.end - task.start
    )}`
  )
}

const handleTargetTask = (
  task,
  markdown,
  name,
  uuidOrId,
  getTemporalDataMarkdown,
  vmSize
) => {
  markdown.push(
    `${INDENT}- **${name}** (${uuidOrId}) ${STATUS_ICON.success}`,
    ...getTemporalDataMarkdown(task.start, task.end, 2)
  )
  task.tasks.forEach(task =>
    handleOperationTask(task, markdown, getTemporalDataMarkdown, vmSize)
  )
}

const TARGET_TASKS_GENERATORS = {
  remote: async function (tasks, vmSize) {
    const markdown = this._markdown
    markdown.push('- **Remotes**')
    for (const task of tasks) {
      const id = task.data.id
      const remote = await this._xo.getRemote(id).catch(() => {})
      const name = remote !== undefined ? remote.name : 'Remote Not found'
      handleTargetTask(
        task,
        markdown,
        name,
        id,
        this._getTemporalDataMarkdown,
        vmSize
      )
    }
  },
  sr: function (tasks, vmSize) {
    const markdown = this._markdown
    markdown.push('- **SRs**')
    for (const task of tasks) {
      const id = task.data.id
      let sr
      try {
        sr = this._xo.getObject(id)
      } catch (e) {}
      const [name, uuid] =
        sr !== undefined ? [sr.name_label, sr.uuid] : [`SR Not found`, id]
      handleTargetTask(
        task,
        markdown,
        name,
        uuid,
        this._getTemporalDataMarkdown,
        vmSize
      )
    }
  },
}

const VM_SUB_TASKS_GENERATORS = {
  snapshot: function (tasks) {
    const markdown = this._markdown
    const snapshotTask = tasks[0]
    markdown.push(
      `- **Snapshot** ${STATUS_ICON.success}`,
      ...this._getTemporalDataMarkdown(snapshotTask.start, snapshotTask.end, 1)
    )
  },
  export: async function (tasks, vmSize) {
    const tasksByType = groupBy(tasks, 'data.type')
    for (const type in tasksByType) {
      const generator = TARGET_TASKS_GENERATORS[type.toLowerCase()]
      generator !== undefined &&
        (await this::generator(tasksByType[type], vmSize))
    }
  },
}

export default class MessageGenerator {
  constructor (xo, log, getTemporalDataMarkdown) {
    this._xo = xo
    this._log = log
    this._getTemporalDataMarkdown = getTemporalDataMarkdown
    this._markdown = []
    this._globalSize = {
      transfer: 0,
      merge: 0,
    }
  }

  async handleVmTask (vmTask) {
    const markdown = this._markdown
    const id = vmTask.data.id
    let vm
    try {
      vm = this._xo.getObject(id)
    } catch (e) {}
    const [name, uuid] =
      vm !== undefined ? [vm.name_label, vm.uuid] : ['VM not found', id]
    markdown.push(
      '',
      `### ${name}`,
      '',
      `- **UUID**: ${uuid}`,
      ...this._getTemporalDataMarkdown(vmTask.start, vmTask.end)
    )

    const vmSize = {
      transfer: undefined,
      merge: undefined,
    }
    const vmSubTasksByType = groupBy(vmTask.tasks, 'message')
    for (const message in vmSubTasksByType) {
      const generator = VM_SUB_TASKS_GENERATORS[message]
      generator !== undefined &&
        (await this::generator(vmSubTasksByType[message], vmSize))
    }
    const globalSize = this._globalSize
    const { transfer, merge } = vmSize
    transfer > 0 && (globalSize.transfer += vmSize.transfer)
    merge > 0 && (globalSize.merge += vmSize.merge)
  }

  getGlobalTransferSize () {
    return this._globalSize.transfer
  }

  getGlobalMergeSize () {
    return this._globalSize.merge
  }

  generate () {
    return this._markdown
  }
}
