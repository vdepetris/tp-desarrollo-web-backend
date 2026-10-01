import { Request, Response } from "express";
import * as usuarioService from "../services/usuario.service";
import { AppError } from "../errors/AppError";
import { leerId } from "../utils/leerId";

/*
  CAPA DE CONTROLLER - USUARIO
  ----------------------------
  El password NUNCA sale en una respuesta: de eso se encarga el service
  (selectPublico y el { password, ...resto }).

  El rol no se acepta desde el body: todo usuario nuevo es "cliente"
  (el default del schema). Los admin se crean desde el seed.
*/

// Validación simple de email: algo@algo.algo, sin espacios.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 6;

/*
  El email es único en la base. Si se repite, Prisma tiraría P2002 y el
  errorHandler respondería un 409 genérico. Lo chequeamos antes para dar
  un mensaje claro. idPropio sirve en el PUT: si el usuario manda su
  mismo email, no es un conflicto.
*/
const verificarEmailLibre = async (email: string, idPropio?: number) => {
  const existente = await usuarioService.obtenerUsuarioPorEmail(email);
  if (existente && existente.id !== idPropio) {
    throw new AppError(409, "Ya existe un usuario con ese email");
  }
};

// GET /usuarios
export const getUsuarios = async (req: Request, res: Response) => {
  const usuarios = await usuarioService.listarUsuarios();
  res.json(usuarios);
};

// GET /usuarios/:id
export const getUsuarioPorId = async (req: Request, res: Response) => {
  const id = leerId(req);
  const usuario = await usuarioService.obtenerUsuarioPorId(id);

  if (!usuario) {
    throw new AppError(404, "Usuario no encontrado");
  }

  res.json(usuario);
};

// POST /usuarios
// Body: { nombre, email, password }
export const postUsuario = async (req: Request, res: Response) => {
  const { nombre, email, password, rol } = req.body ?? {};
  const errores: string[] = [];

  if (typeof nombre !== "string" || nombre.trim() === "") {
    errores.push("El nombre es obligatorio");
  }
  if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    errores.push("El email no es válido");
  }
  // El password no se trimea: los espacios pueden ser parte de la contraseña.
  if (typeof password !== "string" || password.length < PASSWORD_MIN) {
    errores.push(`El password debe tener al menos ${PASSWORD_MIN} caracteres`);
  }
  if (rol !== undefined) {
    errores.push("El rol no se puede asignar");
  }

  if (errores.length > 0) {
    throw new AppError(400, errores.join(". "));
  }

  const emailNormalizado = email.trim().toLowerCase();
  await verificarEmailLibre(emailNormalizado);

  // TODO (auth): hashear el password con bcrypt antes de guardarlo.
  const nuevo = await usuarioService.crearUsuario({
    nombre: nombre.trim(),
    email: emailNormalizado,
    password,
  });

  res.status(201).json(nuevo);
};

// PUT /usuarios/:id
// Actualización parcial: se puede mandar solo el nombre, solo el email, etc.
export const putUsuario = async (req: Request, res: Response) => {
  const id = leerId(req);
  const { nombre, email, password, rol } = req.body ?? {};
  const errores: string[] = [];
  const data: { nombre?: string; email?: string; password?: string } = {};

  if (nombre !== undefined) {
    if (typeof nombre !== "string" || nombre.trim() === "") {
      errores.push("El nombre no puede estar vacío");
    } else {
      data.nombre = nombre.trim();
    }
  }
  if (email !== undefined) {
    if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      errores.push("El email no es válido");
    } else {
      data.email = email.trim().toLowerCase();
    }
  }
  if (password !== undefined) {
    if (typeof password !== "string" || password.length < PASSWORD_MIN) {
      errores.push(`El password debe tener al menos ${PASSWORD_MIN} caracteres`);
    } else {
      // TODO (auth): hashear el password con bcrypt antes de guardarlo.
      data.password = password;
    }
  }
  if (rol !== undefined) {
    errores.push("El rol no se puede modificar");
  }

  if (errores.length > 0) {
    throw new AppError(400, errores.join(". "));
  }

  if (Object.keys(data).length === 0) {
    throw new AppError(400, "No se envió ningún campo para actualizar");
  }

  if (data.email !== undefined) {
    await verificarEmailLibre(data.email, id);
  }

  // Si el usuario no existe, Prisma tira P2025 y el errorHandler responde 404.
  const actualizado = await usuarioService.actualizarUsuario(id, data);
  res.json(actualizado);
};

// DELETE /usuarios/:id
export const deleteUsuario = async (req: Request, res: Response) => {
  const id = leerId(req);

  // P2025 (no existe) → 404
  // P2003 (tiene pedidos) → 409: no borramos usuarios con historial de compras.
  await usuarioService.eliminarUsuario(id);
  res.status(204).send();
};
