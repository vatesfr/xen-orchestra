export default {
  plugins: {
    '@csstools/postcss-global-data': {
      files: ['../web-core/lib/assets/css/.globals.pcss'],
    },
    'postcss-nested': {},
    'postcss-custom-media': {},
    'postcss-color-function': {},
  },
}
