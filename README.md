# Tienda de Suplementos - Backend

API REST de una tienda online de suplementos deportivos. Trabajo Práctico de Desarrollo de Software.

## Tecnologías

- **Node.js** + **TypeScript**
- **Express 5**: framework web
- **Prisma 6**: ORM
- **MySQL 8**: base de datos

## Requisitos previos

- [Node.js](https://nodejs.org/) 20 o superior
- [MySQL](https://dev.mysql.com/downloads/) 8 corriendo en la máquina (o accesible por red)

## Instalación

1. Clonar el repositorio e instalar las dependencias:

   ```bash
   git clone https://github.com/vdepetris/tp-desarrollo-web-backend.git
   cd tp-desarrollo-web-backend
   npm install
   ```

2. Crear el archivo `.env` copiando el de ejemplo:

   ```bash
   cp .env.example .env
   ```

   Editar `.env` y completar `DATABASE_URL` con el usuario y la contraseña de MySQL:

   ```
   DATABASE_URL="mysql://root:tu_password@localhost:3306/tp_ecommerce"
   ```

   La base `tp_ecommerce` **no hace falta crearla**: se crea sola en el paso siguiente.

3. Preparar la base de datos (genera el cliente de Prisma, crea las tablas y carga datos de ejemplo):

   ```bash
   npm run setup
   ```

## Ejecución

**Desarrollo:**

```bash
npm run dev
```

**Producción:**

```bash
npm run build
npm start
```

La API queda disponible en `http://localhost:3000`.

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Levanta el servidor en modo desarrollo |
| `npm run build` | Compila TypeScript a JavaScript en `dist/` |
| `npm start` | Levanta el servidor compilado |
| `npm run setup` | Genera el cliente de Prisma, aplica las migraciones y carga el seed |
| `npm run db:generate` | Regenera el cliente de Prisma |
| `npm run db:migrate` | Aplica las migraciones pendientes |
| `npm run db:seed` | Carga los datos de ejemplo (se puede correr varias veces sin duplicar) |

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Conexión a MySQL | `mysql://root:1234@localhost:3306/tp_ecommerce` |
| `PORT` | Puerto del servidor | `3000` |
| `FRONTEND_URL` | Origen permitido por CORS | `http://localhost:5173` |
| `JWT_SECRET` | Secreto para firmar los tokens (login) | un texto largo y aleatorio |

## Usuarios de prueba

Los crea el seed:

| Email | Password | Rol |
|---|---|---|
| admin@tienda.com | admin123 | admin |
| cliente@tienda.com | cliente123 | cliente |

## Endpoints

### Categorías
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/categorias` | Listar categorías |
| GET | `/categorias/:id` | Detalle de una categoría |
| POST | `/categorias` | Crear categoría |
| PUT | `/categorias/:id` | Modificar categoría |
| DELETE | `/categorias/:id` | Eliminar categoría |

### Productos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/productos` | Listar productos. Filtros opcionales: `?categoriaId=1` y `?q=texto` (busca en nombre y descripción) |
| GET | `/productos/:id` | Detalle de un producto |
| POST | `/productos` | Crear producto |
| PUT | `/productos/:id` | Modificar producto |
| DELETE | `/productos/:id` | Eliminar producto |

### Usuarios
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/usuarios` | Listar usuarios (nunca devuelve el password) |
| GET | `/usuarios/:id` | Detalle de un usuario |
| POST | `/usuarios` | Registrar usuario (siempre con rol `cliente`) |
| PUT | `/usuarios/:id` | Modificar usuario |
| DELETE | `/usuarios/:id` | Eliminar usuario (no se puede si tiene pedidos) |

### Pedidos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/pedidos` | Listar pedidos |
| GET | `/pedidos/:id` | Detalle de un pedido con sus items |
| POST | `/pedidos` | Realizar un pedido. Valida y descuenta el stock en una transacción |
| PATCH | `/pedidos/:id/estado` | Cambiar estado: `pendiente`, `pagado`, `enviado`, `entregado`, `cancelado` |

Ejemplo de body para `POST /pedidos`:

```json
{
  "usuarioId": 2,
  "items": [
    { "productoId": 1, "cantidad": 2 },
    { "productoId": 4, "cantidad": 1 }
  ]
}
```

## Errores

Todos los errores responden con el mismo formato:

```json
{ "error": "Mensaje descriptivo" }
```

| Código | Cuándo |
|---|---|
| 400 | Datos inválidos o mal formados |
| 404 | El recurso no existe |
| 409 | Conflicto con el estado de los datos (email repetido, stock insuficiente, registro con relaciones) |
| 500 | Error inesperado del servidor |

## Estructura del proyecto

```
src/
├── index.ts          # Punto de entrada: configura Express y registra las rutas
├── config/           # Cliente de Prisma
├── routes/           # Define las URLs y qué controller atiende cada una
├── controllers/      # Lee y valida la request, arma la response
├── services/         # Lógica de negocio y acceso a datos con Prisma
├── middlewares/      # Manejo centralizado de errores
├── errors/           # Clases de error propias (AppError, ErrorNegocio)
└── utils/            # Funciones auxiliares
prisma/
├── schema.prisma     # Modelos de la base de datos
├── migrations/       # Historial de cambios de la base
└── seed.ts           # Datos de ejemplo
```

## Para el equipo: cambios en la base de datos

- Después de hacer `git pull`, si hay migraciones nuevas: `npm run db:migrate` y `npm run db:generate`.
- Si **modificás** `schema.prisma`, creá la migración con:

  ```bash
  npx prisma migrate dev --name descripcion_del_cambio
  ```

