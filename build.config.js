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
				__DEV__: true,
				preventAssignment: true
			}),
			cjs()
		]
	}
];
