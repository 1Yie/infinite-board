# 使用多阶段构建
FROM node:20-alpine AS frontend-builder

# 设置工作目录
WORKDIR /app

# 复制前端依赖文件
COPY package*.json ./
COPY bun.lock ./

# 安装前端依赖
RUN npm install

# 复制前端源代码（排除node_modules）
COPY src/ ./src/
COPY public/ ./public/
COPY tsconfig.json ./
COPY tsconfig.app.json ./
COPY tsconfig.node.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY components.json ./
COPY .prettierrc.json ./
COPY eslint.config.js ./

# 构建前端
RUN npm run build

# 后端构建阶段
FROM oven/bun:1-alpine AS backend

# 设置工作目录
WORKDIR /app

# 复制后端依赖文件
COPY server/package*.json ./
COPY server/bun.lock ./

# 安装后端依赖
RUN bun install

# 复制后端源代码（逐个复制关键文件）
COPY server/index.ts ./
COPY server/api/ ./api/
COPY server/db/ ./db/
COPY server/drizzle/ ./drizzle/
COPY server/utils/ ./utils/
COPY server/migrate.ts ./
COPY server/drizzle.config.ts ./
COPY server/tsconfig.json ./

# 运行数据库迁移
RUN bun run migrate

# 最终阶段 - 使用Nginx作为反向代理
FROM nginx:alpine AS final

# 安装必要的工具
RUN apk add --no-cache supervisor

# 复制Nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 复制前端构建产物
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# 从后端阶段复制后端应用
COPY --from=backend /app /app

# 创建supervisor配置文件
RUN echo "[program:backend]" > /etc/supervisor/conf.d/backend.conf && \
    echo "command=bun run dev" >> /etc/supervisor/conf.d/backend.conf && \
    echo "directory=/app" >> /etc/supervisor/conf.d/backend.conf && \
    echo "autostart=true" >> /etc/supervisor/conf.d/backend.conf && \
    echo "autorestart=true" >> /etc/supervisor/conf.d/backend.conf && \
    echo "stderr_logfile=/var/log/backend.err.log" >> /etc/supervisor/conf.d/backend.conf && \
    echo "stdout_logfile=/var/log/backend.out.log" >> /etc/supervisor/conf.d/backend.conf && \
    echo "user=root" >> /etc/supervisor/conf.d/backend.conf && \
    echo "" >> /etc/supervisor/conf.d/backend.conf && \
    echo "[program:nginx]" >> /etc/supervisor/conf.d/backend.conf && \
    echo "command=nginx -g 'daemon off;'" >> /etc/supervisor/conf.d/backend.conf && \
    echo "autostart=true" >> /etc/supervisor/conf.d/backend.conf && \
    echo "autorestart=true" >> /etc/supervisor/conf.d/backend.conf && \
    echo "stderr_logfile=/var/log/nginx.err.log" >> /etc/supervisor/conf.d/backend.conf && \
    echo "stdout_logfile=/var/log/nginx.out.log" >> /etc/supervisor/conf.d/backend.conf && \
    echo "user=root" >> /etc/supervisor/conf.d/backend.conf

# 创建启动脚本
RUN echo "#!/bin/sh" > /start.sh && \
    echo "supervisord -n" >> /start.sh && \
    chmod +x /start.sh

# 暴露端口
EXPOSE 80

# 启动应用
CMD ["/start.sh"]