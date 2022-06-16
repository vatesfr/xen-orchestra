'use strict'

const zlib = require('zlib')
const promisify = require('promise-toolbox/promisify')

const NULL_COMPRESSOR = {
  compress: buffer => buffer,
  decompress: buffer => buffer,
}

const COMPRESSORS = {
  gzip: {
    compress: (
      gzip => buffer =>
        gzip(buffer, { level: zlib.constants.Z_BEST_SPEED })
    )(promisify(zlib.gzip)),
    decompress: promisify(zlib.gunzip),
  },
  brotli: {
    compress: (
      brotliCompress => buffer =>
        brotliCompress(buffer, {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MIN_QUALITY,
          },
        })
    )(promisify(zlib.brotliCompress)),
    decompress: promisify(zlib.brotliDecompress),
  },
}

// inject identifiers
for (const id of Object.keys(COMPRESSORS)) {
  COMPRESSORS[id].id = id
}

function getCompressor(compressorType) {
  if (compressorType === undefined) {
    return NULL_COMPRESSOR
  }

  const compressor = COMPRESSORS[compressorType]

  if (compressor === undefined) {
    throw new Error(`Compression type ${compressorType} is not supported`)
  }

  return compressor
}

exports._getCompressor = getCompressor
