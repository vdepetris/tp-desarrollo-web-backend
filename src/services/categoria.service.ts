import prisma from "../config/prisma";

export const listarCategorias = () => prisma.categoria.findMany();

export const obtenerCategoriaPorId = async (id: number) => {
  return prisma.categoria.findUnique({ where: { id } });
};

export const crearCategoria = (data: { nombre: string }) =>
  prisma.categoria.create({ data });

export const actualizarCategoria = async (id: number, nombre: string) => {
  return prisma.categoria.update({ where: { id }, data: { nombre } });
};

export const eliminarCategoria = async (id: number) => {
  return prisma.categoria.delete({ where: { id } });
};

//Aca hablamos con Prisma directamente. Si llegamos a cambiar de ORM, solo tocás esta capa.