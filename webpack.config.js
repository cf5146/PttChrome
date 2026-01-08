const path = require('path');
const webpack = require('webpack');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssUrlRelativePlugin = require('css-url-relative-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const DEVELOPER_MODE = process.env.NODE_ENV === 'development'
const PRODUCTION_MODE = process.env.NODE_ENV !== 'development'

module.exports = {
  mode: DEVELOPER_MODE ? 'development' : 'production',
  entry: {
    'pttchrome': './src/entry.js',
  },
  output: {
    path: path.join(__dirname, 'dist/assets/'),
    publicPath: 'assets/',
    pathinfo: DEVELOPER_MODE,
    filename: `[name]${ PRODUCTION_MODE ? '.[chunkhash]' : '' }.js`
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(bin|bmp|png|woff)$/,
        oneOf: [
          {
            resourceQuery: /inline/,
            use: 'url-loader'
          },
          {
            use: [
              {
                loader: 'file-loader',
                options: {
                  name: '[name].[hash].[ext]',
                  esModule: false,
                }
              }
            ]
          }
        ]
      }
    ]
  },
  devtool: 'source-map',
  optimization: {
    minimizer: ['...', new CssMinimizerPlugin()],
  },
  plugins: [
    new webpack.ProvidePlugin({
      React: 'react',
      ReactDOM: 'react-dom',
      $: 'jquery',
      jQuery: 'jquery',
      Hammer: 'hammerjs',
    }),
    new webpack.DefinePlugin({
      'process.env.PTTCHROME_PAGE_TITLE': JSON.stringify(process.env.PTTCHROME_PAGE_TITLE || 'PttChrome'),
      'process.env.DEFAULT_SITE': JSON.stringify(PRODUCTION_MODE ? 'wsstelnet://ws.ptt.cc/bbs' : 'wstelnet://localhost:8080/bbs'),
      'process.env.ALLOW_SITE_IN_QUERY': JSON.stringify(process.env.ALLOW_SITE_IN_QUERY === 'yes'),
      'process.env.DEVELOPER_MODE': JSON.stringify(DEVELOPER_MODE),
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[chunkhash].css',
      chunkFilename: '[id].css',
    }),
    new CssUrlRelativePlugin(),
    new HtmlWebpackPlugin({
      minify: {
        collapseWhitespace: PRODUCTION_MODE,
        removeComments: PRODUCTION_MODE
      },
      inject: 'head',
      template: './src/dev.html',
      filename: '../index.html'
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, './dist'),
    },
    devMiddleware: {
      writeToDisk: DEVELOPER_MODE,
    },
    proxy: [
      {
        context: ['/bbs'],
        target: 'https://ws.ptt.cc',
        secure: false,
        ws: true,
        changeOrigin: true,
        onProxyReqWs(proxyReq) {
          // Whitelist does not accept ws.ptt.cc
          proxyReq.setHeader('origin', 'https://term.ptt.cc');
        }
      }
    ]
  }
};
