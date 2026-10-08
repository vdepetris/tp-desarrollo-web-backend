import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";

export const listarProductos = async (
  filtros: {
    categoriaId?: number;
    q?: string;
    precioMaximo?: number;
    orden?: string;
  } = {},
  pagina = 1,
) => {
  const porPagina = 9;
  const where: Prisma.ProductoWhereInput = {};

  if (filtros.categoriaId !== undefined) {
    where.categoriaId = filtros.categoriaId;
  }

  if (filtros.q !== undefined) {
    where.OR = [
      { nombre: { contains: filtros.q } },
      { descripcion: { contains: filtros.q } },
    ];
  }

  if (filtros.precioMaximo !== undefined) {
    where.precio = { lte: filtros.precioMaximo };
  }

  // El id desempata productos con el mismo precio o nombre entre páginas.
  let orderBy: Prisma.ProductoOrderByWithRelationInput[] = [{ id: "asc" }];
  if (filtros.orden === "menor-precio") orderBy = [{ precio: "asc" }, { id: "asc" }];
  if (filtros.orden === "mayor-precio") orderBy = [{ precio: "desc" }, { id: "asc" }];
  if (filtros.orden === "nombre") orderBy = [{ nombre: "asc" }, { id: "asc" }];

  const datos = await prisma.producto.findMany({
    where,
    skip: (pagina - 1) * porPagina,
    take: porPagina,
    orderBy,
    include: { categoria: true },
  });

  const total = await prisma.producto.count({ where });

  return {
    datos,
    total,
    porPagina,
    totalPaginas: Math.ceil(total / porPagina),
  };
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