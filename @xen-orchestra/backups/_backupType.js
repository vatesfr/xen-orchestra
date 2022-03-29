'use strict'

exports.isMetadataFile = filename => filename.endsWith('.json')
exports.isVhdFile = filename => filename.endsWith('.vhd')
exports.isXvaFile = filename => filename.endsWith('.xva')
exports.isXvaSumFile = filename => filename.endsWith('.xva.checksum')
