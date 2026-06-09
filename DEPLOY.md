# Despliegue — VALLUM (Next.js + PostgreSQL)

La app es un único proyecto Next (web + API). Se despliega en **Vercel** y usa un
**Postgres gestionado** (Neon, Supabase o Vercel Postgres). El esquema se crea y
siembra solo en el primer arranque.

---

## 1. Base de datos (Neon — gratis para empezar)

1. Crea una cuenta en <https://neon.tech> y un proyecto.
2. Copia la **cadena de conexión** (Connection string). Usa la variante **"Pooled"**
   (el host lleva `-pooler`): es la adecuada para serverless.
   Se ve así:
   ```
   postgresql://USER:PASSWORD@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```
3. No hace falta crear tablas: la app las crea sola al arrancar.

> Alternativas equivalentes: **Supabase** (Settings → Database → Connection string,
> modo *Transaction/pooler*) o **Vercel Postgres** (se integra solo, paso 3).

## 2. Subir el código a GitHub

```bash
cd vallum-next
git remote add origin https://github.com/TU_USUARIO/vallum-next.git
git push -u origin main
```

(El `.env.local` y la BD local **no** se suben: están en `.gitignore`.)

## 3. Vercel

1. Entra a <https://vercel.com>, **Add New → Project**, e importa el repo.
   Vercel detecta Next.js automáticamente (no necesita configuración).
2. En **Environment Variables**, añade (Production y Preview):

   | Variable | Valor |
   |----------|-------|
   | `DATABASE_URL` | la cadena *pooled* de Neon (paso 1) |
   | `JWT_SECRET` | un secreto largo: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
   | `JWT_EXPIRES_IN` | `2h` |
   | `ADMIN_EMAIL` | tu email de admin |
   | `ADMIN_PASSWORD` | una contraseña fuerte (se guarda hasheada al sembrar) |
   | `PAYMENT_PROVIDER` | `mock` (cámbialo al integrar la pasarela real) |
   | `PAYMENT_WEBHOOK_SECRET` | otro secreto largo |

   `DATABASE_SSL` no hace falta: con un host que no es `localhost`, el SSL se activa solo.

3. **Deploy**. Al terminar tendrás una URL `https://tu-proyecto.vercel.app` con HTTPS.

### Vía CLI (alternativa)

```bash
npm i -g vercel        # si no la tienes
vercel login           # interactivo
vercel                 # primer deploy (preview)
vercel --prod          # a producción
# añade las env vars con: vercel env add NOMBRE
```

## 4. Tras el primer deploy

- El esquema se crea y se siembran 8 productos + el admin (`ADMIN_EMAIL`/`ADMIN_PASSWORD`).
- Entra a `/admin`, inicia sesión y **cambia/gestiona** el catálogo.
- Cambia la contraseña por defecto si usaste una de ejemplo.

## Checklist de producción (pendientes recomendados)

- [ ] **Pasarela de pago real** (Wompi/Mercado Pago): implementar `createPayment` y
      mapear su webhook; configurar la URL del webhook en su panel.
- [ ] **Rate-limiting** en `/api/auth/login` (p. ej. con `@upstash/ratelimit`).
- [ ] **Monitoreo de errores** (Sentry).
- [ ] **Tests** del proyecto Next (su API aún no tiene suite propia).
- [ ] **JWT en cookie HttpOnly** en vez de `localStorage` (mitiga XSS).
- [ ] **Backups** automáticos de la BD (Neon/Supabase los ofrecen).
- [ ] Revisar **`npm audit`** y subir parches de dependencias.
