# VALLUM — Next.js (migración SEO)

Versión **Next.js (App Router)** del frontend de Vallum. Su objetivo es el **SEO**:
la landing se renderiza en el **servidor** (SSR), así Google recibe el HTML con los
productos y los `<meta>` ya dentro — a diferencia de la versión Vite (SPA), donde el
HTML inicial era un `<div>` vacío.

Es una **migración por fases** (patrón *strangler fig*): este proyecto consume el
**mismo backend Express + SQLite** de `../vallum-react/server` mientras se migra la UI.

## Estado (Fase 1)

✅ Landing pública con **SSR + metadata** (Hero, Marquee, Calidades, Catálogo, Footer)
✅ Escena 3D (`dynamic` sin SSR), carrito y página de pago `/pago/[reference]`
🔜 Fases siguientes: rutas por género (`/hombre`…), panel admin, y **consolidar la API
   dentro de Next** (Route Handlers) para retirar Express y el frontend Vite.

## Requisitos para correr

Necesita el backend de `vallum-react` escuchando en `http://localhost:3001`:

```bash
# Terminal 1 — backend (desde la carpeta hermana)
cd ../vallum-react && npm run server

# Terminal 2 — frontend Next
cd vallum-next
npm install
npm run dev        # http://localhost:3000
```

- El **SSR** pide los productos a `API_ORIGIN` (por defecto `http://localhost:3001`).
- Las llamadas del **navegador** a `/api/*` se reenvían al backend vía `next.config.js`
  (`rewrites`), igual que el proxy de Vite.

## Cómo se logra el SEO

- `app/page.jsx` es un **Server Component**: hace `fetch` de los productos en el servidor
  y los renderiza dentro del HTML.
- `app/layout.jsx` exporta `metadata` (título, descripción, Open Graph) que Next inyecta
  en el `<head>`.
- Los componentes interactivos (carrito, tarjetas, 3D) llevan `'use client'`; Next igual
  los renderiza a HTML en el servidor y luego los **hidrata** en el navegador.

## Verificación rápida del SSR

```bash
curl -s http://localhost:3000/ | grep -o "<title>[^<]*</title>"
curl -s http://localhost:3000/ | grep -c "Inspirado en"   # > 0 ⇒ productos en el HTML
```
