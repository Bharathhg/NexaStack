# Use lightweight nginx to serve static files
FROM nginx:1.25-alpine

RUN rm -rf /usr/share/nginx/html/*

COPY . /usr/share/nginx/html/

RUN echo 'server { \
  listen 80; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { try_files $uri $uri/ /index.html; } \
  location /api { \
    proxy_pass http://service-2-be:4002; \
    proxy_set_header Host $host; \
    proxy_set_header X-Real-IP $remote_addr; \
  } \
  location /health { proxy_pass http://service-2-be:4002/health; } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
