#!/usr/bin/env node

'use strict'

const fs = require('fs')

const mapKeys = (object, iteratee) => {
  const result = {}
  for (const key of Object.keys(object)) {
    result[iteratee(key, object)] = object[key]
  }
  return result
}

const args = process.argv.slice(2)
if (args.length === 0) {
  const { description, name, version } = require('./package.json')
  const bin = 'toggle-scripts'
  process.stdout.write(`Usage: ${bin} options...

  ${description}

  Options
    +<script>    Enable the script <script>, ie remove the prefix \`_\`
    -<script>    Disable the script <script>, ie prefix it with \`_\`

  Examples
    ${bin} +postinstall +preuninstall
    ${bin} -postinstall -preuninstall

${name} v${version}
`)
  // eslint-disable-next-line n/no-process-exit
  process.exit()
}

const plan = { __proto__: null }
for (const arg of args) {
  const action = arg[0]
  const script = arg.slice(1)

  if (action === '+') {
    plan['_' + script] = script
  } else if (action === '-') {
    plan[script] = '_' + script
  } else {
    throw new Error('invalid param: ' + arg)
  }
}

const pkgPath = process.env.npm_package_json || './package.json'
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
pkg.scripts = mapKeys(pkg.scripts, (name, scripts) => {
  const newName = plan[name]
  if (newName === undefined) {
    return name
  }
  if (newName in scripts) {
    throw new Error('script already defined: ' + name)
  }
  return newName
})
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
