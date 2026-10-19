import "express-session";

// Datos públicos que conserva el servidor para identificar al usuario.
declare module "express-session" {
  interface SessionData {
    usuario: { id: number; nombre: string; email: string; rol: "cliente" | "admin" };
  }
}
