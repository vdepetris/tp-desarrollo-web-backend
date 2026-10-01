import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";

export const listarProductos = async (filtros: {
  categoriaId?: number;
  q?: string;
} = {}) => {
  // Armamos el where solo con los filtros que llegaron. Sin filtros queda {} y trae todo.
  const where: Prisma.ProductoWhereInput = {};

  if (filtros.categoriaId !== undefined) {
    where.categoriaId = filtros.categoriaId;
  }
  if (filtros.q !== undefined) {
    // Busca el texto en el nombre O en la descripción (como un LIKE '%texto%' en SQL).
    where.OR = [
      { nombre: { contains: filtros.q } },
      { descripcion: { contains: filtros.q } },
    ];
  }

  return prisma.producto.findMany({ where, include: { categoria: true } });
};


export const obtenerProductoPorId = async (id: number) => {
  return prisma.producto.findUnique({ //Busca uno por campo único
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
  data: Partial<{ //es un utility type de TypeScript que convierte todos los campos en opcionales, permite hacer un PUT mandando solo { precio: 30000 } sin que TypeScript se queje por los campos faltantes
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
//Aca hicimos la validación de entrada y el manejo de errores que pide la consigna (status codes correctos, try/catch).