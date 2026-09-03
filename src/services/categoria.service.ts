import prisma from "../config/prisma";

export const listarCategorias = async () => {
  return prisma.categoria.findMany();
};

export const obtenerCategoriaPorId = async (id: number) => {
  return prisma.categoria.findUnique({ where: { id } });
};

export const crearCategoria = async (nombre: string) => {
  return prisma.categoria.create({ data: { nombre } });
};

export const actualizarCategoria = async (id: number, nombre: string) => {
  return prisma.categoria.update({ where: { id }, data: { nombre } });
};

export const eliminarCategoria = async (id: number) => {
  return prisma.categoria.delete({ where: { id } });
}