import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { mapPrismaError } from "../utils/prismaError";

// Express reconoce un middleware de errores porque tiene 4 parámetros.
// Aunque no usemos `next`, tiene que estar.
export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Errores nuestros: throw new AppError(404, "...")
  if (error instanceof AppError) {
    res.status(error.status).json({ error: error.message });
    return;
  }

  // 2. El cliente mandó un JSON mal escrito en el body
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ error: "El JSON enviado no es válido" });
    return;
  }

  // 3. Errores conocidos de Prisma (P2025, P2002, P2003)
  const prismaError = mapPrismaError(error);
  if (prismaError) {
    res.status(prismaError.status).json({ error: prismaError.message });
    return;
  }

  // 4. Cualquier otra cosa: es un bug nuestro
  console.error(error);
  res.status(500).json({ error: "Error interno del servidor" });
};
