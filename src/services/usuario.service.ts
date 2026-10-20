import { Rol } from "@prisma/client";
import { hash, compare } from "bcryptjs";
import prisma from "../config/prisma";
import { AppError } from "../errors/AppError";

// Campos seguros para devolver al cliente: nunca incluir "password" acá.
const selectPublico = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  creadoEn: true,
};

export const listarUsuarios = async () => {
  return prisma.usuario.findMany({ select: selectPublico });
};

export const obtenerUsuarioPorId = async (id: number) => {
  return prisma.usuario.findUnique({
    where: { id },
    select: selectPublico,
  });
};

export const obtenerUsuarioPorEmail = async (email: string) => {
  // Este sí puede necesitar el password completo (para el login más adelante),
  // por eso no usa selectPublico.
  return prisma.usuario.findUnique({ where: { email } });
};

// Comprueba la contraseña contra el hash y devuelve solo los datos públicos.
export const autenticarUsuario = async (email: string, password: string) => {
  const usuario = await obtenerUsuarioPorEmail(email);

  // El mismo mensaje evita revelar si el email está registrado.
  if (!usuario || !(await compare(password, usuario.password))) {
    throw new AppError(401, "Email o contraseña incorrectos");
  }

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
  };
};

export const crearUsuario = async (data: {
  nombre: string;
  email: string;
  password: string;
  rol?: Rol;
}) => {
  // Guarda un hash de la contraseña; el texto original nunca llega a la base.
  const creado = await prisma.usuario.create({
    data: { ...data, password: await hash(data.password, 10) },
  });
  const { password, ...resto } = creado;
  return resto;
};

export const actualizarUsuario = async (
  id: number,
  data: Partial<{
    nombre: string;
    email: string;
    password: string;
    rol: Rol;
  }>
) => {
  // Solo genera un nuevo hash cuando se envía una contraseña para cambiarla.
  const actualizado = await prisma.usuario.update({
    where: { id },
    data: {
      ...data,
      ...(data.password !== undefined
        ? { password: await hash(data.password, 10) }
        : {}),
    },
  });
  const { password, ...resto } = actualizado;
  return resto;
};

export const eliminarUsuario = async (id: number) => {
  return prisma.usuario.delete({ where: { id } });
};
