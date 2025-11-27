import Handlebars from 'handlebars'
import fs from 'node:fs/promises'

import mjmlTransform from './mjml/transform.js'
import markdownTransform from './markdown/transform.js'
import path from 'node:path'

const dir = import.meta.dirname

function humanReadableRule(rule) {
  const VARIABLE_TO_TEXT = {
    cpuUsage: 'Cpu usage',
    memoryUsage: 'Memory usage',
    storageUsage: 'Storage usage ',
  }
  const TYPE_TO_TEXT = {
    host: 'host',
    SR: 'storage repository',
    VM: 'virtual machine',
  }
  const COMPARATOR_TO_TEXT = {
    '<': 'less',
    '>': 'more',
  }
  return `${VARIABLE_TO_TEXT[rule.variableName]}  of the ${TYPE_TO_TEXT[rule.objectType]} is  ${COMPARATOR_TO_TEXT[rule.comparator]} than ${rule.triggerLevel} % ot total `
}

const mjmlTemplate = Handlebars.create()

mjmlTemplate.registerPartial('mjmlFooter', await fs.readFile(path.join(dir, '_partials/mjmlFooter.hbs'), 'utf8'))
mjmlTemplate.registerPartial('mjmlHeaders', await fs.readFile(path.join(dir, '_partials/mjmlHeaders.hbs'), 'utf8'))
mjmlTemplate.registerHelper('humanReadableRule', humanReadableRule)
const compileMjmlTemplate = mjmlTemplate.compile(
  (await fs.readFile(path.join(dir, 'mjml/newAlarms.hbs'), 'utf8')).replace(/\n$/, '')
)

const markdownTemplate = Handlebars.create()
markdownTemplate.registerHelper('humanReadableRule', humanReadableRule)
const compiledMdTemplate = markdownTemplate.compile(
  (await fs.readFile(path.join(dir, 'markdown/newAlarms.hbs'), 'utf8')).replace(/\n$/, '')
)

export const mjml = {
  transform: mjmlTransform,
  template: compileMjmlTemplate,
}

export const markdown = {
  transform: markdownTransform,
  template: compiledMdTemplate,
}
