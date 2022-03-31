'use strict'

module.exports = vmTpl => vmTpl.is_default_template || vmTpl.other_config.default_template === 'true'
