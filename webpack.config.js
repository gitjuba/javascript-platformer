var fs = require('fs');

var bodyParser = require('body-parser');
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
  })],
  devServer: {
    before: (app, server) => {
      app.use(bodyParser.json());
      app.post('/levels', (req, res) => {
        try {
          fs.writeFileSync('./src/levels.json', JSON.stringify(req.body, null, 2), 'utf8');
          res.json({ message: 'Levels exported' });
        } catch (err) {
          res.json({ message: 'Error' });
        }
      })
    }
  }
};
