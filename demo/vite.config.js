import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import replace from '@rollup/plugin-replace';

export default defineConfig({
	plugins: [
		react({
			jsxImportSource: 'WhyReact'
		}),
		replace({
			__DEV__: true,
			preventAssignment: true
		})
	],
	resolve: {
		alias: [
			{
				find: 'src/index/jsx-dev-runtime',
				replacement: '../src/index'
			},
			{
				find: 'WhyReact',
				replacement: '../src'
			}
		]
	}
});
