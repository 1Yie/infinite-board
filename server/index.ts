import { Elysia, t } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { api } from './api';
import 'dotenv/config';

const port = process.env.PORT || 3000;
const corsOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || [
	'http://localhost:5173',
];

const app = new Elysia()
	.use(cors({ origin: corsOrigins, credentials: true }))
	.use(
		swagger({
			documentation: {
				info: {
					title: '画板 API',
					description: '画板系统的后端 API 文档',
					version: '1.0.0',
				},
			},
		})
	)

	.onRequest(({ request }) => {
		console.log(`${request.method} ${request.url}`);
	})

	.use(api)

	.get('/', () => 'Hello Elysia Server!', {
		detail: {
			tags: ['General'],
			summary: '健康检查 / 欢迎页',
			description: '用于检测服务器是否启动成功的根路径。',
		},
		response: {
			200: t.String({
				description: '服务器返回的欢迎文本',
				example: 'Hello Elysia Server!',
			}),
		},
	})

	.listen(port);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;
