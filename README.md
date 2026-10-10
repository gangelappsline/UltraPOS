# UltraPOS

SPA de punto de venta en español con React 18, TypeScript estricto y Vite. Interfaz responsive con un modo demostración independiente de la API. **No requiere Docker.**

## Ejecutar

Requiere Node.js **22.12 o posterior** y npm.

```bash
npm install
cp .env.example .env
npm run dev
```

Vite escucha en `0.0.0.0:5173`. Para compilar: `npm run build`; para revisar la compilación: `npm run preview`. En un servidor estático se deben redirigir las rutas de la SPA a `index.html`.

La primera visita abre una **demostración** con datos locales. No se hacen llamadas al backend en este modo. Cierra sesión para usar el login real o para entrar a una demostración de vendedor / administrador global. Los correos y cambios de suscripción en demo no tienen efectos externos. Los reportes demo utilizan una muestra fija de octubre de 2026, no un registro contable real.

Para reiniciar la demostración, elimina las claves `ultrapos-*` del almacenamiento local del navegador. El carrito no se persiste para evitar recuperar ventas incompletas al iniciar otra sesión.

## Funcionalidad

- **Acceso:** login, registro de dueño y negocio, recuperación/restablecimiento, perfil y consulta `/auth/me`.
- **Navegación:** sidebar responsive, selector de negocio, notificaciones con actualización optimista y rollback, menú de usuario, guardas por rol y componente `Can`.
- **Resumen:** KPIs, gráfica comparativa, productos destacados, ventas recientes, alertas de inventario y accesos rápidos.
- **POS:** búsqueda por nombre/SKU/código, carrito Zustand, cantidades decimales, descuentos por línea y globales, cliente, efectivo/tarjeta/transferencia/crédito, cambio, confirmación y recibo.
- **Productos:** crear/editar/eliminar, búsqueda, categorías, paginación, ajustes de stock con motivo, variantes CRUD, exportación e importación CSV validada.
- **Catálogo:** mantenimiento de categorías, marcas y unidades, con lectura del árbol de categorías.
- **Ventas:** listado, detalle, recibo y cancelación restringida a dueño/admin. En demo, la cancelación devuelve stock y revierte caja/crédito.
- **Clientes/proveedores:** CRUD, historial del cliente y abonos. La venta a crédito requiere cliente y aumenta su saldo en demo.
- **Compras:** órdenes simples de un producto y recepción que incrementa stock en demo.
- **Caja:** apertura, ingresos, retiros, cierre y movimientos. Una venta en efectivo incrementa la caja demo cuando está abierta.
- **Reportes:** ventas, productos, ganancias e impuestos; rango de fechas y exportación.
- **Suscripción:** plan actual, confirmación de cambio e historial de facturación.
- **Admin:** rutas protegidas, CRUD básico de negocios, planes y usuarios; lectura de auditoría. El demo de admin se elige en login.
- **Accesibilidad:** etiquetas de formularios, diálogos Radix con focus trap y Escape, estados vacíos/carga/error, menú móvil y movimiento reducido.

Atajos: **F2** abre POS; **Ctrl/⌘ K** enfoca búsqueda global.

## Stack y organización

```text
src/
  api/                  Axios, schemas Zod, recursos y endpoints
  components/
    ui/                 Button con patrón shadcn/ui (CVA + Radix Slot)
    shared/             DataTable, Modal Radix, Can, estados, ErrorBoundary
    layout/             Shell de navegación
  features/             Dashboard, Auth, POS, Products, Catalog, Reports, Admin...
  hooks/                Permisos y persistencia de registros demo
  stores/               Auth, carrito y datos demo (Zustand)
  lib/                  Formato MXN, clases, fixtures y pruebas
  types/                Interfaces de dominio y envelope
public/products/        Ilustraciones SVG locales, sin dependencia de imágenes externas
```

TanStack Query v5 maneja server state; TanStack Table v8 usa paginación manual del servidor. Formularios de autenticación/productos usan React Hook Form + Zod; CSV y envelope también se validan con Zod. Los formularios auxiliares tienen restricciones HTML y validación final del servidor. Sonner muestra los mensajes de error, Recharts los gráficos y Framer Motion las transiciones. El carrito es síncrono y local: sus cambios se ven de inmediato; la venta se confirma mediante `useMutation`, sin simular éxito antes de que el servidor responda.

## API y contratos pendientes de validar

```env
VITE_API_URL=https://ultrapost-api.appsline.com.mx/api/v1
```

El repositorio original no contenía OpenAPI ni esquemas completos de las peticiones. La implementación usa los endpoints del encargo y **contratos inferidos**, que deben reconciliarse con la documentación real antes de un despliegue productivo. No se ejecutaron operaciones contra la API real ni se suministraron credenciales. Las pruebas de integración de UI usan el modo demo, y las del cliente HTTP usan un adapter simulado.

### Contrato implementado

- Envelope: `{ success, message, data, error?: { code, details }, meta: { timestamp, request_id, pagination? } }`.
- El interceptor valida el envelope, retorna `{data, pagination}`, conserva metadatos de paginación y produce `ApiError(message, code, details)`.
- Paginación esperada: `{current_page, last_page, per_page, total}`; el payload de los listados es un arreglo.
- Login/registro con sesión: `data: { token: string, user: User }`; `User` incluye `role: admin | business | seller` y `businesses: Business[]`.
- Encabezados: `Authorization: Bearer <token>` y **`X-Business-Id`**. Este último es una convención a confirmar con backend.
- Un HTTP 401 elimina la sesión y redirige a login. El resto de errores conserva código/detalles y muestra el mensaje del backend.
- La UI usa nombres/campos simplificados: `Product.category` es string, precios son números y `Sale.items` contiene `{product, quantity, discount}`. Si el backend devuelve IDs, relaciones anidadas o decimales como strings, agrega la normalización en `src/api`.
- `GET /dashboard`: `{revenue, sales, ticket, customers, chart:[{day,actual,previous}], top_products:[{product,quantity,total}]}`.
- Reportes: `{total,count,average,chart,rows:[{name,quantity,total}]}`. Las diferencias entre cada reporte deberán adaptarse al esquema oficial.
- Recibo: `GET /sales/:id/receipt` devuelve `{url}`; email usa `POST /sales/:id/receipt/email` con `{email}`.

### Rutas adicionales inferidas

`/dashboard`, `/cash-registers/current`, `/cash-registers/movements`, `/cash-registers/:id/movements`, `/customers/:id/sales`, `/notifications/:id/read`, `/products/import`, `/sales/:id/cancel`, `/subscriptions/invoices`, `/brands`, `/units`, `/admin/{tenants,plans,users,audit-logs}`. Confirmar métodos y payloads; las rutas expresamente dadas en el encargo se mantienen.

## Antes de producción

1. **Contrato e integración:** validar schemas, CORS, encabezado tenant, scopes de Passport, códigos de error, impuestos y cálculo final de venta. Los roles del cliente solo controlan UX: el backend debe autorizar cada operación y tenant.
2. **Seguridad de sesión:** el token se almacena en localStorage, como permite el encargo. Para mayor resistencia ante XSS, preferir cookies HttpOnly/Secure/SameSite gestionadas por el backend, con CSRF si corresponde. No hay refresh token ni revocación remota porque no se especificaron esos contratos.
3. **POS avanzado:** integración de variantes seleccionables en el carrito, pagos mixtos, impresión térmica, precisión monetaria multi-divisa y funcionamiento offline quedan fuera de esta base. La etiqueta de impuestos presupone precios finales; el servidor es la autoridad de stock, impuestos y total.
4. **Compras/caja/admin:** ampliar órdenes a múltiples renglones/recepción parcial, conciliación de caja, filtros avanzados de auditoría y formularios administrativos con todos los campos del backend. El demo no simula concurrencia, fiscalización ni pasarelas de pago.
5. **Catálogo:** las opciones iniciales del formulario de producto son una lista básica; vincular marcas, variantes y taxonomías dinámicas a los IDs del backend cuando se confirme el esquema. Los CSV exportan los resultados actualmente cargados (no todas las páginas remotas).
6. **Dependencias:** `npm audit` todavía reporta avisos en Tailwind 3 y su cadena de herramientas, y React Router 6. Se conserva Router 6 por el requisito explícito. Revisar impacto y acordar migración antes de publicar; no usar el servidor de desarrollo como servidor productivo. Vitest fue actualizado para eliminar sus avisos críticos conocidos.
7. **Operación:** configurar CSP, monitoreo de errores, pruebas contra sandbox backend, accesibilidad/auditoría de contraste y tests de concurrencia. La validación local no equivale a una certificación de producción.

## Pruebas

```bash
npm test                # cálculo del carrito, descuentos, stock, envelope, token y 401
npm run build           # TypeScript estricto + bundle Vite dividido por módulos
npm run test:browser    # flujos de UI; Chromium headless para Linux
```

Las pruebas de navegador usan `@sparticuz/chromium` distribuido por npm. Opcionalmente configura `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` con un Chromium instalado. Guardan capturas en `test-results/`, excluido de Git. No requieren credenciales ni tocan el backend.

Flujos verificados: cobro en efectivo y recibo, creación de producto y cliente, apertura de caja, rutas de los módulos, bloqueo de reportes para vendedor, alta administrativa y menú móvil. La vista de 390 px no presenta desbordamiento horizontal.
