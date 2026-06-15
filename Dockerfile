FROM node:22-alpine AS builder
WORKDIR /app
COPY ./ /app/
RUN npm install
RUN npm run build -- --configuration=production
FROM nginx:alpine
COPY default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/frontend-angular/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
