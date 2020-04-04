const path = require('path');

module.exports = [{
  mode: process.env.ENV || 'development',
  target: 'electron-main',
  entry: {
    main: './src/serve/main.ts',
  },
  node: {
    __dirname: false
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "ts-loader",
          options: {
            configFile: "tsconfig.serve.json"
          }
        }
      },
      // for imports from handlebars-helpers with dynamic required calls
      { test: /\.js$/, loader: "unlazy-loader" }
    ]
  },
  resolve: {
    alias: {
      "handlebars": "handlebars/dist/handlebars.js"
    },
    extensions: [ '.ts', '.tsx', '.js' ]
  },
  output: {
    filename: '[name]-bundle.js',
    path: path.resolve(__dirname, "dist")
  }
}];
