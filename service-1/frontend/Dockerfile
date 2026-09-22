# Use lightweight nginx to serve static files
FROM nginx:1.25-alpine

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy our frontend files
COPY . /usr/share/nginx/html/

# Custom nginx config to proxy /api calls to backend
RUN echo 'server { \
  listen 80; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { try_files $uri $uri/ /index.html; } \
  location /api { \
    proxy_pass http://service-1-be:4001; \
    proxy_set_header Host $host; \
    proxy_set_header X-Real-IP $remote_addr; \
  } \
  location /health { proxy_pass http://service-1-be:4001/health; } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
