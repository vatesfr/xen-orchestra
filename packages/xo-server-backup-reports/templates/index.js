'use strict'

const Handlebars = require('handlebars')
const { join, parse } = require('node:path')
const { readdirSync, statSync, readFileSync } = require('node:fs')

const helpers = require('./_helpers.js')

for (const name of readdirSync(__dirname)) {
  // ignore `.`, `..` and hidden entries
  // entries starting by `_` are considered as private and will not be processed either
  if (name[0] === '.' || name[0] === '_') {
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

  const partials = new Map()
  const registerPartials = dir => {
    let entries
    try {
      entries = readdirSync(dir)
    } catch (error) {
      if (error.code === 'ENOENT') {
        return
      }
      throw error
    }
    for (const base of entries) {
      const parts = parse(base)
      if (parts.ext === '.hbs') {
        const { name } = parts
        const path = join(dir, base)
        if (partials.has(name)) {
          const error = new Error('confliciting partial: ' + name)
          error.previous = partials.get(name)
          error.current = path
          throw error
        }
        partials.set(name, path)
        handlebars.registerPartial(name, readFileSync(path, 'utf8'))
      }
    }
  }
  registerPartials(join(__dirname, '_partials'))
  registerPartials(join(path, 'partials'))

  for (const name of readdirSync(path)) {
    const parts = parse(name)
    if (parts.ext === '.hbs') {
      template['$' + parts.name] = handlebars.compile(readFileSync(join(path, name), 'utf-8').replace(/\n$/, ''))
    }
  }

  exports[name] = template
}
