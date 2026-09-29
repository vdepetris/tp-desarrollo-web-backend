import { Request } from "express";
import { AppError } from "../errors/AppError";

// Todo lo que viene en la URL es string. Number("abc") da NaN y
// Number("") da 0, por eso validamos que sea entero y mayor a 0.
export const leerId = (req: Request) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, "El id debe ser un número entero positivo");
  }
  return id;
};
