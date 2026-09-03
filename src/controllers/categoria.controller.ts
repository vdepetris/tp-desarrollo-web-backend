import { Request, Response } from "express";
import * as categoriaService from "../services/categoria.service";

export const getCategorias = async (req: Request, res: Response) => {
  const categorias = await categoriaService.listarCategorias();
  res.json(categorias);
};

export const getCategoriaPorId = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const categoria = await categoriaService.obtenerCategoriaPorId(id);
  if (!categoria) {
    return res.status(404).json({ error: "Categoria no encontrada" });
  }
  res.json(categoria);
};

export const postCategoria = async (req: Request, res: Response) => {
  const { nombre } = req.body;
  if (!nombre) {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }
  const nueva = await categoriaService.crearCategoria(nombre);
  res.status(201).json(nueva);
};

export const putCategoria = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { nombre } = req.body;
  if (!nombre) {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }
  const actualizada = await categoriaService.actualizarCategoria(id, nombre);
  res.json(actualizada);
};

export const deleteCategoria = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await categoriaService.eliminarCategoria(id);
  res.status(204).send();
};