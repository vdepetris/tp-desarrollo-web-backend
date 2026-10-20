import { RequestHandler } from "express";
import { AppError } from "../errors/AppError";

// Los permisos se comprueban en el servidor, nunca desde datos del navegador.
export const requiereSesion: RequestHandler = (req, res, next) => {
  if (!req.session.usuario) throw new AppError(401, "Tenés que iniciar sesión");
  next();
};

export const requiereAdmin: RequestHandler = (req, res, next) => {
  if (!req.session.usuario) throw new AppError(401, "Tenés que iniciar sesión");
  if (req.session.usuario.rol !== "admin") throw new AppError(403, "No tenés permisos para esta acción");
  next();
};
