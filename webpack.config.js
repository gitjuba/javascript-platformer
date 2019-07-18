var HtmlWebpackPlugin = require('html-webpack-plugin');

var isProd = process.env.ENV === 'prod';

module.exports = {
  mode: isProd ? 'production' : 'development',
  entry: './src/index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'main.js'
  },
  devtool: isProd ? '' : 'cheap-eval-source-map',
  plugins: [new HtmlWebpackPlugin({
    template: './src/index.html'
  })]
}
