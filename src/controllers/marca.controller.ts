import { leerId } from "../utils/leerId";
import { Request, Response } from "express";
import * as marcaService from "../services/marca.service";
import { AppError } from "../errors/AppError";

/*
  CAPA DE CONTROLLER
  ------------------
  Su única responsabilidad es traducir entre HTTP y el service:
    1. Leer lo que llega del cliente (req.params, req.body)
    2. Validar que sea usable ANTES de tocar la base de datos
    3. Responder con el resultado

  Los errores NO se manejan acá: se lanzan con `throw` y los atrapa
  el errorHandler (middlewares/errorHandler.ts). En Express 5, cualquier
  error dentro de una función async llega solo al errorHandler,
  por eso no hace falta try/catch.

  Los errores de Prisma (P2002, P2025, P2003) también los traduce
  el errorHandler, usando mapPrismaError.
*/

// GET /marcas
export const getMarcas = async (req: Request, res: Response) => {
  const pagina = Number(req.query.page ?? 1);

  if ((req.query.page !== undefined && typeof req.query.page !== "string") || !Number.isSafeInteger(pagina) || pagina < 1) {
    throw new AppError(400, "page debe ser un entero positivo");
  }

  const marcas = await marcaService.listarMarcas(pagina);
  res.json(marcas);
};

// GET /marcas/:id
export const getMarcaPorId = async (req: Request, res: Response) => {
  const id = leerId(req);
  const marca = await marcaService.obtenerMarcaPorId(id);

  // findUnique NO lanza error cuando no encuentra: devuelve null.
  // Por eso el 404 lo chequeamos a mano.
  if (!marca) {
    throw new AppError(404, "Marca no encontrada");
  }

  res.json(marca);
};

// POST /marcas
export const postMarca = async (req: Request, res: Response) => {
  // `?? {}` por si la request llega sin body: sin eso, desarmar undefined rompe.
  const { nombre } = req.body ?? {};

  // Validamos el TIPO, no solo la existencia: "   " o 123 no son nombres válidos.
  if (typeof nombre !== "string" || nombre.trim() === "") {
    throw new AppError(400, "El nombre es obligatorio");
  }

  // Si el nombre ya existe, Prisma tira P2002 y el errorHandler responde 409.
  const nueva = await marcaService.crearMarca({ nombre: nombre.trim() });
  res.status(201).json(nueva);
};

// PUT /marcas/:id
export const putMarca = async (req: Request, res: Response) => {
  const id = leerId(req);
  const { nombre, estado } = req.body ?? {};

  if (typeof nombre !== "string" || nombre.trim() === "") {
    throw new AppError(400, "El nombre es obligatorio");
  }

  // Validamos el estado antes de enviarlo a Prisma. Si no viene, conservamos el actual
  // para que los clientes que solo editan el nombre sigan funcionando.
  if (estado !== undefined && estado !== "activo" && estado !== "inactivo") {
    throw new AppError(400, "El estado debe ser activo o inactivo");
  }

  // Si el id no existe, Prisma tira P2025 y el errorHandler responde 404.
  const actualizada = await marcaService.actualizarMarca(id, nombre.trim(), estado);
  res.json(actualizada);
};

// DELETE /marcas/:id
export const deleteMarca = async (req: Request, res: Response) => {
  const id = leerId(req);

  // P2025 (no existe) → 404
  // P2003 (tiene productos asociados) → 409
  // Los dos los resuelve el errorHandler.
  await marcaService.eliminarMarca(id);

  // 204 = No Content: salió bien y no hay nada que devolver.
  res.status(204).send();
};
