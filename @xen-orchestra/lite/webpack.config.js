/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path')
const webpack = require('webpack')

const resolveApp = relative => path.resolve(__dirname, relative)

const { NODE_ENV = 'production' } = process.env
const __PROD__ = NODE_ENV === 'production'

// https://webpack.js.org/configuration/
module.exports = {
  mode: NODE_ENV,
  target: 'web',
  devServer: {
    historyApiFallback: true,
  },
  entry: resolveApp('src/index.tsx'),
  output: {
    filename: __PROD__ ? '[name].[contenthash:8].js' : '[name].js',
    path: resolveApp('dist'),
  },
  optimization: {
    moduleIds: __PROD__ ? 'deterministic' : undefined,
    runtimeChunk: true,
    splitChunks: {
      chunks: 'all',
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
          },
        },
      },
      {
        test: /\.css$/i,
        use: ['css-loader'],
      },
    ],
  },
  resolve: {
    alias: {
      dns: false,
    },
    extensions: ['.tsx', '.ts', '.js'],
  },
  devtool: __PROD__ ? 'source-map' : 'eval-cheap-module-source-map',
  plugins: [
    new (require('clean-webpack-plugin').CleanWebpackPlugin)(),
    new (require('html-webpack-plugin'))({
      template: resolveApp('public/index.html'),
      favicon: resolveApp('public/favicon.ico'),
    }),
    new webpack.EnvironmentPlugin({ XAPI_HOST: '', NPM_VERSION: require('./package.json').version }),
    new (require('node-polyfill-webpack-plugin'))(),
  ].filter(Boolean),
}
