# Frontend - Sistema GRD-FONASA

Frontend del sistema de gestión hospitalaria UC CHRISTUS.

## Instalación

```bash
npm install
cp .env.example .env
```

Completa las variables `VITE_AUTH0_*` con las credenciales reales (los placeholders `YOUR_*` provocan error en runtime).

## Ejecutar

```bash
npm run dev
```

La aplicación se abre en `http://localhost:8000/login`

## Autenticación

- El frontend intenta cargar la configuración de Auth0 desde el backend en runtime:

```
GET http://localhost:3001/public/config
```

- Si el backend no está disponible, se usan las variables `VITE_AUTH0_*`. Ambas fuentes se validan y la app falla si detecta placeholders o valores vacíos.
- Botón "Ingresar con Auth0" redirige al proveedor y vuelve a `/admin`.

## Build

```bash
npm run build
```

## Archivos principales

- `src/pages/Login.tsx` - Página de login
- `src/pages/Admin.tsx` - Panel de administración
- `src/components/AuthContext.tsx` - Wrapper sobre `auth0-react`
- `src/utils/authFetch.ts` - Helper para llamadas con token Bearer
- `src/components/UCHeader.tsx` - Header del sistema
