import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import replace from '@rollup/plugin-replace';

export default defineConfig({
	plugins: [
		react({
			jsxImportSource: '../src/'
		}),
		replace({
			__DEV__: true,
			preventAssignment: true
		})
	],
	resolve: {
		alias: []
	}
});
