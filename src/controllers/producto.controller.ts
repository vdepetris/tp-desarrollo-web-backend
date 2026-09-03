import { Request, Response } from "express";
import * as productoService from "../services/producto.service";

export const getProductos = async (req: Request, res: Response) => {
  const productos = await productoService.listarProductos();
  res.json(productos);
};

export const getProductoPorId = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const producto = await productoService.obtenerProductoPorId(id);
  if (!producto) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }
  res.json(producto);
};

export const postProducto = async (req: Request, res: Response) => {
  const { nombre, descripcion, precio, stock, categoriaId } = req.body;

  if (!nombre || precio === undefined || !categoriaId) {
    return res.status(400).json({
      error: "nombre, precio y categoriaId son obligatorios",
    });
  }

  try {
    const nuevo = await productoService.crearProducto({
      nombre,
      descripcion,
      precio,
      stock: stock ?? 0,
      categoriaId,
    });
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(400).json({ error: "No se pudo crear el producto. Verificá que la categoriaId exista." });
  }
};

export const putProducto = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { nombre, descripcion, precio, stock, categoriaId } = req.body;

  try {
    const actualizado = await productoService.actualizarProducto(id, {
      nombre,
      descripcion,
      precio,
      stock,
      categoriaId,
    });
    res.json(actualizado);
  } catch (error) {
    res.status(404).json({ error: "Producto no encontrado" });
  }
};

export const deleteProducto = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await productoService.eliminarProducto(id);
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ error: "Producto no encontrado" });
  }
};