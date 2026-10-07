import prisma from "../config/prisma";
import type { EstadoCategoria } from "@prisma/client";

// Contamos los productos relacionados sin traer todos sus datos.
export const listarCategorias = async () => {
  const categorias = await prisma.categoria.findMany({
    include: {
      _count: {
        select: { productos: true },
      },
    },
  });

  // Convertimos la estructura de Prisma al campo que utiliza la tabla del frontend.
  return categorias.map(({ _count, ...categoria }) => ({
    ...categoria,
    cantidadProductos: _count.productos,
  }));
};

export const obtenerCategoriaPorId = async (id: number) => {
  return prisma.categoria.findUnique({ where: { id } });
};

// El esquema asigna estado activo automáticamente al crear una categoría.
export const crearCategoria = (data: { nombre: string }) =>
  prisma.categoria.create({ data });

export const actualizarCategoria = async (id: number, nombre: string, estado?: EstadoCategoria) => {
  // Nombre y estado se guardan juntos. Omitir estado deja intacto el valor existente.
  // Activar/inactivar no elimina la categoría ni cambia sus productos relacionados.
  return prisma.categoria.update({
    where: { id },
    data: { nombre, ...(estado !== undefined ? { estado } : {}) },
  });
};

export const eliminarCategoria = async (id: number) => {
  // La relación con Producto impide eliminar categorías que todavía tengan productos.
  return prisma.categoria.delete({ where: { id } });
};

//Aca hablamos con Prisma directamente. Si llegamos a cambiar de ORM, solo tocás esta capa.
