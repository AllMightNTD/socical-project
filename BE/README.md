# NestJS Base – Docker Development Workflow

This repository provides a **clean, reproducible NestJS development setup using Docker & Docker Compose**.

The goal is simple:

- Clone → Build → Run
- **No `npm install` on host**
- **No permission (EACCES) issues**
- Same environment for everyone

---

## 🧱 Tech Stack

- Node.js 20 (Alpine)
- NestJS
- TypeScript
- ts-node-dev (hot reload)
- Docker & Docker Compose v2

---

## 📦 Prerequisites

Make sure these are installed on your machine:

- Docker
- Docker Compose v2 (`docker compose`)
- Git

> ⚠️ Do **NOT** run `npm install` on the host when using Docker.

---

## 🚀 Getting Started (Correct Workflow)

### 1️⃣ Clone the repository

```bash
git clone <repository-url>
cd NestJS-Base
```

---

### 2️⃣ Build the development image

Docker will automatically:

- Install **all dependencies** using `npm ci`
- Include `devDependencies` (ts-node-dev, Nest CLI, etc.)
- Prepare the dev environment

```bash
docker compose build --no-cache app-dev
```

---

### 3️⃣ Start the development container

```bash
docker compose up app-dev
```

NestJS will start in **development mode with hot reload**.

---

## 🧠 Important Rules (Read Carefully)

### ❌ Never do these

- ❌ `npm install` on host
- ❌ `sudo npm install`
- ❌ Install packages inside a running container
- ❌ Commit `node_modules`
- ❌ Mount `node_modules` from host

These actions will cause **permission (EACCES) errors** and unstable environments.

---

### ✅ Correct way to add dependencies

#### Add a production dependency

```bash
# edit package.json
npm install <package-name> --save
```

#### Add a development dependency

```bash
# edit package.json
npm install <package-name> -D
```

Then **rebuild the Docker image**:

```bash
docker compose build --no-cache app-dev
docker compose up app-dev
```

> Dependency installation always happens at **build time**, not inside containers.

---

## 🧩 Development Configuration

### start command

```json
"start:dev": "ts-node-dev --respawn --transpile-only src/main.ts"
```

### Required devDependencies

Already included in `package.json`:

- ts-node
- ts-node-dev
- typescript
- @nestjs/cli

---

## 🐳 Docker Architecture

### Dockerfile stages

| Stage       | Purpose                             |
| ----------- | ----------------------------------- |
| base        | Install all dependencies (`npm ci`) |
| development | Run NestJS in watch mode            |
| build       | Compile production code             |
| production  | Lightweight runtime image           |

---

## 📁 .dockerignore

The following files are excluded from Docker context:

```
node_modules
dist
.git
.env
```

---

## 🔧 docker-compose Volume Rule (Very Important)

```yaml
volumes:
  - .:/app
  - /app/node_modules
```

This ensures:

- Source code is editable on host
- Dependencies stay inside the container
- No permission issues

---

## 🧪 Debugging

Enter the dev container:

```bash
docker exec -it nestjs-dev sh
```

Check installed binaries:

```bash
ls node_modules/.bin | grep ts
```

Expected output:

```
ts-node
ts-node-dev
```

---

## 🛑 Reset Everything (If Needed)

```bash
docker compose down -v
docker compose build --no-cache app-dev
docker compose up app-dev
```

---

## 🏁 Summary (Golden Rules)

> ✅ Clone → Build → Up
> ❌ Never `npm install` on host
> ❌ Never install packages inside running containers

Following this workflow guarantees:

- No permission issues
- Clean and reproducible dev environment
- Easy onboarding for new developers

---

## 📄 License

MIT
