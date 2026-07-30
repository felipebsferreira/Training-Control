# TrainingControl

App multiusuário para gerenciar treinos de musculação: cadastre treinos em dias específicos da semana e detalhe cada exercício (nome, técnica/método, séries, repetições por série, carga atual e faixa de descanso). Cada conta só vê os próprios dados.

## Stack

- Backend: Node.js + Express + Prisma ORM
- Frontend: React + Vite + Tailwind CSS + React Router
- Banco: MySQL

## Pré-requisitos

- Node.js 18+
- MySQL rodando localmente (instalado via `brew install mysql`, iniciado com `brew services start mysql`)

## Configuração inicial

```bash
npm install
```

O arquivo `backend/.env` já aponta para o banco `training_control` com o usuário `training_app` (criado durante a configuração inicial) e inclui um `JWT_SECRET` usado para assinar a sessão de login — troque por um valor aleatório próprio se for além de uso local (veja `backend/.env.example`). Se precisar recriar o banco:

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS training_control CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -e "CREATE USER IF NOT EXISTS 'training_app'@'localhost' IDENTIFIED BY 'training_app_pw'; GRANT ALL PRIVILEGES ON *.* TO 'training_app'@'localhost'; FLUSH PRIVILEGES;"
```

Rodar as migrations:

```bash
npm run prisma:migrate -w backend
```

## Rodando em desenvolvimento

```bash
npm run dev
```

Isso sobe backend (`http://localhost:3001`) e frontend (`http://localhost:5173`) juntos. Abra `http://localhost:5173` no navegador.

## Estrutura

```
backend/    API REST (Express + Prisma)
frontend/   SPA (React + Vite + Tailwind)
```
