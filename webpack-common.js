const path = require('path') 

module.exports = {
	entry: './src/main.js',
	output: {
		filename: 'main.js', 
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				use: [
					{
						loader: 'style-loader' 
					},
					{
						loader: 'css-loader' 
					}
				]
			},
			{
				test: /\.scss$/,
				use: [
					{
						loader: 'style-loader' 
					},
					{
						loader: 'css-loader' 
					},
					{
						loader: 'sass-loader' 
					}
				]
			}
		]
	},
	plugins: [
	], 
	context: __dirname
}
