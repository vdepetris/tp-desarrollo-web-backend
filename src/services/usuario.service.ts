import { Rol } from "@prisma/client";
import prisma from "../config/prisma";

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

export const crearUsuario = async (data: {
  nombre: string;
  email: string;
  password: string;
  rol?: Rol;
}) => {
  const creado = await prisma.usuario.create({ data });
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
  const actualizado = await prisma.usuario.update({ where: { id }, data });
  const { password, ...resto } = actualizado;
  return resto;
};

export const eliminarUsuario = async (id: number) => {
  return prisma.usuario.delete({ where: { id } });
};
