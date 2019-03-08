const path = require('path')

const resolveApp = relative => path.resolve(__dirname, relative)

const { NODE_ENV = 'production' } = process.env
const __PROD__ = NODE_ENV === 'production'

// https://webpack.js.org/configuration/
module.exports = {
  mode: NODE_ENV,
  entry: resolveApp('src/index.js'),
  output: {
    filename: __PROD__ ? '[name].[contenthash:8].js' : '[name].js',
    path: resolveApp('dist'),
  },
  optimization: {
    runtimeChunk: true,
    splitChunks: {
      chunks: 'all',
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
          },
        },
      },
    ],
  },
  devtool: __PROD__ ? 'source-map' : 'cheap-module-eval-source-map',
  plugins: [
    new (require('clean-webpack-plugin'))(),
    new (require('html-webpack-plugin'))({
      template: resolveApp('public/index.html'),
    }),
    __PROD__ && new (require('webpack')).HashedModuleIdsPlugin(),
  ].filter(Boolean),
}
