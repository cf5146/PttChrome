const path = require('node:path');
const webpack = require('webpack');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssUrlRelativePlugin = require('css-url-relative-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const WebpackCdnPlugin = require('webpack-cdn-plugin');

const DEVELOPER_MODE = process.env.NODE_ENV === 'development';
const PRODUCTION_MODE = process.env.NODE_ENV !== 'development';

module.exports = {
  entry: {
    'pttchrome': './src/entry.js',
  },
  output: {
    path: path.join(__dirname, 'dist/assets/'),
    publicPath: DEVELOPER_MODE ? '/assets/' : 'assets/',
    pathinfo: DEVELOPER_MODE,
    filename: `[name]${PRODUCTION_MODE ? '.[contenthash]' : ''}.js`,
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
    new webpack.DefinePlugin({
      'process.env.PTTCHROME_PAGE_TITLE': JSON.stringify(process.env.PTTCHROME_PAGE_TITLE || 'PttChrome'),
      'process.env.DEFAULT_SITE': JSON.stringify(process.env.DEFAULT_SITE || (PRODUCTION_MODE ? 'wsstelnet://ws.ptt.cc/bbs' : 'wstelnet://localhost:8080/bbs')),
      'process.env.ALLOW_SITE_IN_QUERY': JSON.stringify(process.env.ALLOW_SITE_IN_QUERY === 'yes'),
      'process.env.DEVELOPER_MODE': JSON.stringify(DEVELOPER_MODE),
    }),
    new MiniCssExtractPlugin({
      filename: PRODUCTION_MODE ? '[name].[contenthash].css' : '[name].css',
      chunkFilename: PRODUCTION_MODE ? '[id].[contenthash].css' : '[id].css',
    }),
    new CssUrlRelativePlugin(),
    new HtmlWebpackPlugin({
      alwaysWriteToDisk: DEVELOPER_MODE,
      minify: {
        collapseWhitespace: PRODUCTION_MODE,
        removeComments: PRODUCTION_MODE
      },
      inject: 'head',
      template: './src/dev.html',
      filename: '../index.html'
    }),
    new WebpackCdnPlugin({
      crossOrigin: 'anonymous',
      modules: [
        {
          // jQuery is still required by the legacy terminal core.
          name: 'jquery',
          var: 'jQuery',
          path: 'dist/jquery.min.js',
        },
        {
          name: 'hammerjs',
          var: 'Hammer',
          path: 'hammer.min.js',
        },
        {
          name: 'react',
          var: 'React',
          path: 'umd/react.production.min.js',
        },
        {
          name: 'react-dom',
          var: 'ReactDOM',
          path: 'umd/react-dom.production.min.js',
        },
      ],
    })
  ].concat(DEVELOPER_MODE ? [
    new HtmlWebpackHarddiskPlugin()
  ] : []),
  devServer: {
    static: {
      directory: path.join(__dirname, './dist'),
    },
    devMiddleware: {
      publicPath: '/assets/',
    },
    proxy: [
      {
        context: ['/bbs'],
        target: 'https://ws.ptt.cc',
        secure: true,
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
