import cjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';

export default [
	{
		input: `./src/index.js`,
		output: {
			file: `./dist/index.js`,
			name: 'WhyReact',
			format: 'umd'
		},
		plugins: [
			replace({
				__DEV__: false,
				preventAssignment: true
			}),
			cjs()
		]
	},
	{
		input: `./src/jsx-runtime.js`,
		output: [
			// jsx-runtime
			{
				file: `./dist/jsx-runtime.js`,
				name: 'jsx-runtime',
				format: 'umd'
			},
			// jsx-dev-runtime
			{
				file: `./dist/jsx-dev-runtime.js`,
				name: 'jsx-dev-runtime',
				format: 'umd'
			}
		],
		plugins: [
			replace({
				__DEV__: false,
				preventAssignment: true
			}),
			cjs()
		]
	}
];
