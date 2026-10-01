import { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import * as marcaService from "../services/marca.service";

//GET /marcas
export const getMarcas = async (req: Request, res: Response) => {
  const marcas = await marcaService.getMarcas();

  if (marcas.length === 0) {
    throw new AppError(404, "No hay marcas registradas");
  }

};

//POST /marcas
// Body: { nombre, descripcion?, origen? }
export const postMarca = async (req: Request, res: Response) => {
  const { nombre, descripcion, origen } = req.body ?? {};
  const errores: string[] = [];
  if (typeof nombre !== "string" || nombre.trim() === "") {
    throw new AppError(400, "El nombre es obligatorio");
  }
  if (descripcion !== undefined && typeof descripcion !== "string") {
    throw new AppError(400, "La descripción debe ser texto");
  }
  if (origen !== undefined && typeof origen !== "string") {
    throw new AppError(400, "El origen debe ser texto");
  }
  if (errores.length > 0) {
    throw new AppError(400, errores.join(". "));
  }
  const nueva = await marcaService.crearMarca({ nombre: nombre.trim() });
  
};

  
