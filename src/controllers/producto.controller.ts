import { Request, Response } from "express";
import * as productoService from "../services/producto.service";
import * as categoriaService from "../services/categoria.service";
import { AppError } from "../errors/AppError";
import { leerId } from "../utils/leerId";

/*
  CAPA DE CONTROLLER - PRODUCTO
  -----------------------------
  Producto es un CRUD dependiente: no puede existir sin una Categoria.

  Igual que en Categoria, los errores se lanzan con `throw` y los
  resuelve el errorHandler. No hace falta try/catch (Express 5).
*/

/*
  Si la categoriaId no existe, Prisma tiraría P2003 y el errorHandler
  respondería 409. Pero eso es un dato mal mandado por el cliente, o sea
  un 400. Por eso lo chequeamos ANTES de crear o actualizar.
*/
const verificarCategoria = async (categoriaId: number) => {
  const categoria = await categoriaService.obtenerCategoriaPorId(categoriaId);
  if (!categoria) {
    throw new AppError(400, "La categoría indicada no existe");
  }
};

// GET /productos
export const getProductos = async (req: Request, res: Response) => {
  // Cada producto viene con su categoría completa (include en el service).
  const productos = await productoService.listarProductos();
  res.json(productos);
};

// GET /productos/:id
export const getProductoPorId = async (req: Request, res: Response) => {
  const id = leerId(req);
  const producto = await productoService.obtenerProductoPorId(id);

  // findUnique devuelve null si no encuentra, no lanza error.
  if (!producto) {
    throw new AppError(404, "Producto no encontrado");
  }

  res.json(producto);
};

// POST /productos
export const postProducto = async (req: Request, res: Response) => {
  const { nombre, descripcion, precio, stock, categoriaId } = req.body ?? {};

  // Juntamos todos los errores para que el cliente los vea de una vez.
  const errores: string[] = [];

  if (typeof nombre !== "string" || nombre.trim() === "") {
    errores.push("El nombre es obligatorio");
  }
  if (typeof precio !== "number" || precio <= 0) {
    errores.push("El precio debe ser un número mayor a 0");
  }
  // Number.isInteger rechaza decimales: no existe medio producto en stock.
  if (!Number.isInteger(stock) || stock < 0) {
    errores.push("El stock debe ser un entero mayor o igual a 0");
  }
  if (!Number.isInteger(categoriaId) || categoriaId <= 0) {
    errores.push("La categoría es obligatoria");
  }
  // descripcion es opcional, pero si viene tiene que ser texto.
  if (descripcion !== undefined && typeof descripcion !== "string") {
    errores.push("La descripción debe ser texto");
  }

  if (errores.length > 0) {
    throw new AppError(400, errores.join(". "));
  }

  await verificarCategoria(categoriaId);

  const nuevo = await productoService.crearProducto({
    nombre: nombre.trim(),
    descripcion,
    precio,
    stock,
    categoriaId,
  });

  res.status(201).json(nuevo);
};

// PUT /productos/:id
export const putProducto = async (req: Request, res: Response) => {
  const id = leerId(req);
  const { nombre, descripcion, precio, stock, categoriaId } = req.body ?? {};
  const errores: string[] = [];

  /*
    Actualización parcial: el cliente puede mandar solo el precio, o solo
    el stock. Armamos `data` únicamente con los campos que llegaron.
    Un campo ausente no es un error, es "no lo quiero tocar".
  */
  const data: Record<string, unknown> = {};

  if (nombre !== undefined) {
    if (typeof nombre !== "string" || nombre.trim() === "") {
      errores.push("El nombre no puede estar vacío");
    } else {
      data.nombre = nombre.trim();
    }
  }
  if (precio !== undefined) {
    if (typeof precio !== "number" || precio <= 0) {
      errores.push("El precio debe ser un número mayor a 0");
    } else {
      data.precio = precio;
    }
  }
  if (stock !== undefined) {
    if (!Number.isInteger(stock) || stock < 0) {
      errores.push("El stock debe ser un entero mayor o igual a 0");
    } else {
      data.stock = stock;
    }
  }
  if (categoriaId !== undefined) {
    if (!Number.isInteger(categoriaId) || categoriaId <= 0) {
      errores.push("La categoría no es válida");
    } else {
      data.categoriaId = categoriaId;
    }
  }
  if (descripcion !== undefined) {
    if (typeof descripcion !== "string") {
      errores.push("La descripción debe ser texto");
    } else {
      data.descripcion = descripcion;
    }
  }

  if (errores.length > 0) {
    throw new AppError(400, errores.join(". "));
  }

  // Si mandaron un body vacío, avisamos en vez de hacer un update sin cambios.
  if (Object.keys(data).length === 0) {
    throw new AppError(400, "No se envió ningún campo para actualizar");
  }

  // Solo si quieren cambiar la categoría, verificamos que exista.
  if (categoriaId !== undefined) {
    await verificarCategoria(categoriaId);
  }

  // Si el producto no existe, Prisma tira P2025 y el errorHandler responde 404.
  const actualizado = await productoService.actualizarProducto(id, data);
  res.json(actualizado);
};

// DELETE /productos/:id
export const deleteProducto = async (req: Request, res: Response) => {
  const id = leerId(req);

  // P2025 (no existe) → 404
  // P2003 (forma parte de un pedido) → 409, un conflicto real con la base.
  await productoService.eliminarProducto(id);
  res.status(204).send();
};
