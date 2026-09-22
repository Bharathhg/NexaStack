# Microservices CI/CD — 2 Services

A production-ready microservices project with two independent services, each having a Frontend (HTML/CSS/JS) and Backend (Node.js + Express), wired up through GitHub Actions CI/CD, Docker Hub, and AWS EC2.
######
---

## 🗂️ Project Structure

```
project/
├── .github/workflows/deploy.yml   ← CI/CD pipeline (GitHub Actions)
├── service-1/
│   ├── frontend/                  ← User Management Dashboard (port 3001)
│   │   ├── index.html
│   │   ├── style.css
│   │   ├── app.js
│   │   └── Dockerfile
│   └── backend/                   ← REST API (port 4001)
│       ├── server.js
│       ├── package.json
│       └── Dockerfile
├── service-2/
│   ├── frontend/                  ← Analytics Dashboard (port 3002)
│   │   ├── index.html
│   │   ├── style.css
│   │   ├── app.js
│   │   └── Dockerfile
│   └── backend/                   ← REST API (port 4002)
│       ├── server.js
│       ├── package.json
│       └── Dockerfile
└── docker-compose.yml             ← Local dev
```

---

## 🧑‍💻 Team Structure

| Role | Service | Module | Owns |
|------|---------|--------|------|
| FE Developer 1 | Both | Module 1 | `index.html` Module 1 section + `app.js` Module 1 functions |
| FE Developer 2 | Both | Module 2 | `index.html` Module 2 section + `app.js` Module 2 functions |
| BE Developer 1 | Both | Module 1 | `server.js` `/api/module1/*` routes |
| BE Developer 2 | Both | Module 2 | `server.js` `/api/module2/*` routes |

---

## 🚀 Quick Start (Local)

### Prerequisites
- Docker & Docker Compose installed
- Node.js 18+ (optional, for running without Docker)

### Run all services locally

```bash
git clone https://github.com/your-org/your-repo.git
cd your-repo
docker compose up --build
```

| Service | URL |
|---------|-----|
| Service 1 Frontend | http://localhost:3001 |
| Service 1 Backend  | http://localhost:4001 |
| Service 2 Frontend | http://localhost:3002 |
| Service 2 Backend  | http://localhost:4002 |

### Health checks

```bash
curl http://localhost:4001/health
curl http://localhost:4002/health
```

### Run backend without Docker

```bash
cd service-1/backend && npm install && npm start
cd service-2/backend && npm install && npm start
```

---

## 🔄 CI/CD Pipeline

```
Developer pushes to main
        │
        ▼
GitHub Actions (.github/workflows/deploy.yml)
        │
        ├── Job 1: Build service-1-fe + service-1-be → Docker Hub
        ├── Job 2: Build service-2-fe + service-2-be → Docker Hub
        │
        └── Job 3: SSH → AWS EC2
                  docker compose pull
                  docker compose up -d
```

### GitHub Secrets Setup

Go to your GitHub repo → **Settings → Secrets and variables → Actions → New secret**

| Secret | Value |
|--------|-------|
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub **access token** (not password!) |
| `AWS_HOST` | EC2 public IP (e.g. `18.234.56.78`) |
| `AWS_USER` | EC2 SSH user (usually `ubuntu` for Ubuntu AMI) |
| `AWS_SSH_KEY` | Full contents of your `.pem` key file |

> **Docker Hub access token**: hub.docker.com → Account Settings → Security → New Access Token

---

## ☁️ AWS EC2 Setup

1. **Launch** an EC2 instance (Ubuntu 22.04 recommended, `t2.micro` for free tier)
2. **Install Docker** on the instance:
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-plugin
   sudo usermod -aG docker ubuntu
   ```
3. **Open ports** in Security Group:
   - 22 (SSH)
   - 3001, 3002 (Frontend)
   - 4001, 4002 (Backend API)
4. **Add your SSH key** as `AWS_SSH_KEY` secret in GitHub

---

## 📡 API Reference

### Service 1 (port 4001)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/module1/users` | Get all users (BE Dev 1) |
| POST | `/api/module1/users` | Create user (BE Dev 1) |
| GET | `/api/module2/products` | Get all products (BE Dev 2) |
| POST | `/api/module2/products` | Create product (BE Dev 2) |

### Service 2 (port 4002)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/module1/analytics` | Get analytics (BE Dev 1) |
| POST | `/api/module1/analytics/export` | Export report (BE Dev 1) |
| GET | `/api/module2/events` | Get events (BE Dev 2) |
| POST | `/api/module2/events` | Log event (BE Dev 2) |

---

## 🐳 Docker Images

After CI runs, 4 images are pushed to Docker Hub:

```
your-dockerhub-username/service-1-fe:latest
your-dockerhub-username/service-1-be:latest
your-dockerhub-username/service-2-fe:latest
your-dockerhub-username/service-2-be:latest
```

---

## 🔧 Useful Commands

```bash
# View running containers
docker compose ps

# View logs
docker compose logs -f service-1-be

# Rebuild single service
docker compose up --build service-1-be

# Stop everything
docker compose down

# Clean up images
docker image prune -f
```
