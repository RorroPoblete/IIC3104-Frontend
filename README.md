# IIC3104 Frontend

Proyecto base: React 18 + TypeScript + Vite, con Ant Design y Ant Design Pro Components. Vista mínima: "Hello World".

## Requisitos

- Node.js ≥ 20.19.0 (o 22.12+). Vite requiere esta versión o superior.
- npm ≥ 10

Sugerido gestionar versiones con `nvm`:

```bash
nvm install 20.19.0
nvm use 20.19.0
```

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

La app estará disponible en `http://localhost:5173`.

## Build de producción

```bash
npm run build
```

El resultado queda en la carpeta `dist/`.

## Preview local del build

```bash
npm run preview
```

## Estructura relevante

- `src/main.tsx`: configuración de React + `ConfigProvider` de Ant Design.
- `src/App.tsx`: vista mínima con `ProCard` mostrando "Hello World".

## Notas

- Si ves un warning de engines de Node, actualiza Node a ≥ 20.19.
