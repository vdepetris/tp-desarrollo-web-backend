import { leerId } from "../utils/leerId";
import { Request, Response } from "express";
import * as categoriaService from "../services/categoria.service";
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

// Todo lo que viene en la URL es string. Number("abc") da NaN y


// GET /categorias
export const getCategorias = async (req: Request, res: Response) => {
  const categorias = await categoriaService.listarCategorias();
  res.json(categorias);
};

// GET /categorias/:id
export const getCategoriaPorId = async (req: Request, res: Response) => {
  const id = leerId(req);
  const categoria = await categoriaService.obtenerCategoriaPorId(id);

  // findUnique NO lanza error cuando no encuentra: devuelve null.
  // Por eso el 404 lo chequeamos a mano.
  if (!categoria) {
    throw new AppError(404, "Categoría no encontrada");
  }

  res.json(categoria);
};

// POST /categorias
export const postCategoria = async (req: Request, res: Response) => {
  // `?? {}` por si la request llega sin body: sin eso, desarmar undefined rompe.
  const { nombre } = req.body ?? {};

  // Validamos el TIPO, no solo la existencia: "   " o 123 no son nombres válidos.
  if (typeof nombre !== "string" || nombre.trim() === "") {
    throw new AppError(400, "El nombre es obligatorio");
  }

  // Si el nombre ya existe, Prisma tira P2002 y el errorHandler responde 409.
  const nueva = await categoriaService.crearCategoria({ nombre: nombre.trim() });
  res.status(201).json(nueva);
};

// PUT /categorias/:id
export const putCategoria = async (req: Request, res: Response) => {
  const id = leerId(req);
  const { nombre } = req.body ?? {};

  if (typeof nombre !== "string" || nombre.trim() === "") {
    throw new AppError(400, "El nombre es obligatorio");
  }

  // Si el id no existe, Prisma tira P2025 y el errorHandler responde 404.
  const actualizada = await categoriaService.actualizarCategoria(id, nombre.trim());
  res.json(actualizada);
};

// DELETE /categorias/:id
export const deleteCategoria = async (req: Request, res: Response) => {
  const id = leerId(req);

  // P2025 (no existe) → 404
  // P2003 (tiene productos asociados) → 409
  // Los dos los resuelve el errorHandler.
  await categoriaService.eliminarCategoria(id);

  // 204 = No Content: salió bien y no hay nada que devolver.
  res.status(204).send();
};
