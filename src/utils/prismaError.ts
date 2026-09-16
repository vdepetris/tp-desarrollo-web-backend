/**
 * Traduce los errores conocidos de Prisma a status HTTP + mensaje.
 * Detecta el error por su propiedad `code` en vez de importar la clase,
 * así no depende de dónde esté generado el cliente de Prisma.
 * Devuelve null si el error no es de Prisma (lo maneja el catch como 500).
 */
export const mapPrismaError = (error: unknown) => {
    if (typeof error !== "object" || error === null) return null;
  
    const code = (error as { code?: string }).code;
    if (typeof code !== "string" || !code.startsWith("P")) return null;
  
    switch (code) {
      case "P2025": // el registro no existe (update / delete)
        return { status: 404, message: "El recurso no existe" };
      case "P2002": // violación de índice único
        return { status: 409, message: "Ya existe un registro con ese valor" };
      case "P2003": // violación de foreign key
        return { status: 409, message: "El recurso está relacionado con otros registros" };
      default:
        return null;
    }
  };