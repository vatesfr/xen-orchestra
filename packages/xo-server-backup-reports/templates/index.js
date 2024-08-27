'use strict'

const Handlebars = require('handlebars')
const { join, parse } = require('node:path')
const { readdirSync, statSync, readFileSync } = require('node:fs')

const helpers = require('./_helpers.js')

for (const name of readdirSync(__dirname)) {
  // ignore `.`, `..` and hidden entries
  if (name[0] === '.') {
    continue
  }

  const path = join(__dirname, name)

  // ignore non-directories
  if (!statSync(path).isDirectory()) {
    continue
  }

  const template = { __proto__: null }

  template.transform = require(join(path, 'transform.js'))

  const handlebars = Handlebars.create()

  for (const [name, fn] of Object.entries(helpers)) {
    handlebars.registerHelper(name, fn)
  }

  const partialsPath = join(path, 'partials')
  for (const name of readdirSync(partialsPath)) {
    const parts = parse(name)
    if (parts.ext === '.hbs') {
      handlebars.registerPartial(parts.name, readFileSync(join(partialsPath, name), 'utf8'))
    }
  }

  for (const name of readdirSync(path)) {
    const parts = parse(name)
    if (parts.ext === '.hbs') {
      template['$' + parts.name] = handlebars.compile(readFileSync(join(path, name), 'utf-8').replace(/\n$/, ''))
    }
  }

  exports[name] = template
}
