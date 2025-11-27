import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => ({
	plugins: [
		react({
			babel: {
				plugins: [['babel-plugin-react-compiler']],
			},
		}),
		tailwindcss(),
	],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	// 生产环境移除 console 和 debugger
	build: {
		minify: 'esbuild',
		esbuild: {
			drop: mode === 'production' ? ['console', 'debugger'] : [],
		},
	},
}));
