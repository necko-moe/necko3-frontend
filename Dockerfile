FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN VITE_BACKEND_URL=/api npm run build

FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.sh /app-entrypoint.sh
RUN chmod +x /app-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/app-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
