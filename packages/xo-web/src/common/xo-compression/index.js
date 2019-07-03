export SelectCompression from './select-compression'

// zstd detection source: https://github.com/xapi-project/xen-api/commit/adca3b750da06deb9a141ad2447605601c49a177
export const isZstdSupported = container =>
  container.type === 'host'
    ? container.license_params.restrict_zstd_export === 'false'
    : container.restrictions.restrict_zstd_export === 'false'
