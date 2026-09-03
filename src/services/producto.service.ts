import prisma from "../config/prisma";

export const listarProductos = async () => {
  return prisma.producto.findMany({ include: { categoria: true } });
};

export const obtenerProductoPorId = async (id: number) => {
  return prisma.producto.findUnique({
    where: { id },
    include: { categoria: true },
  });
};

export const crearProducto = async (data: {
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoriaId: number;
}) => {
  return prisma.producto.create({ data });
};

export const actualizarProducto = async (
  id: number,
  data: Partial<{
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    categoriaId: number;
  }>
) => {
  return prisma.producto.update({ where: { id }, data });
};

export const eliminarProducto = async (id: number) => {
  return prisma.producto.delete({ where: { id } });
};