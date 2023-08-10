module.exports = {
	presets: ['@babel/preset-env'],
	plugins: [
		[
			'@babel/plugin-transform-react-jsx',
			{
				throwIfNamespace: false,
				runtime: 'automatic' // defaults to classic
			}
		]
	]
};
