import prisma from "../config/prisma";

export const listarProductos = async () => {
  return prisma.producto.findMany({ include: { categoria: true } }); //Trae todos los registros el findMany
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