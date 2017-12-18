const { NODE_ENV = 'development' } = process.env

module.exports = {
  comments: false,
  compact: true,
  ignore: NODE_ENV === 'test' ? undefined : ['*.spec.js'],
  // plugins: ['lodash']
  presets: [
    [
      'env',
      {
        debug: true,
        loose: true,
        targets: {
          node: process.env.NODE_ENV === 'production' ? '6' : 'current',
        },
        useBuiltIns: 'usage',
      },
    ],
    'flow',
  ],
}
