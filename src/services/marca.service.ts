import prisma from "../config/prisma";
import type { EstadoMarca } from "@prisma/client";

// Contamos los productos relacionados sin traer todos sus datos.
export const listarMarcas = async (pagina = 1) => {
  const porPagina = 9;

  const marcas = await prisma.marca.findMany({
    skip: (pagina - 1) * porPagina,
    take: porPagina,
    orderBy: { id: "asc" },
    include: {
      _count: {
        select: { productos: true },
      },
    },
  });

  const datos = marcas.map(({ _count, ...marca }) => ({
    ...marca,
    cantidadProductos: _count.productos,
  }));

  const total = await prisma.marca.count();

  return {
    datos,
    porPagina,
    totalPaginas: Math.ceil(total / porPagina),
  };
};

export const obtenerMarcaPorId = async (id: number) => {
  return prisma.marca.findUnique({ where: { id } });
};

// El esquema asigna estado activo automáticamente al crear una marca.
export const crearMarca = (data: { nombre: string }) =>
  prisma.marca.create({ data });

export const actualizarMarca = async (id: number, nombre: string, estado?: EstadoMarca) => {
  // Nombre y estado se guardan juntos. Omitir estado deja intacto el valor existente.
  // Activar/inactivar no elimina la marca ni cambia sus productos relacionados.
  return prisma.marca.update({
    where: { id },
    data: { nombre, ...(estado !== undefined ? { estado } : {}) },
  });
};

export const eliminarMarca = async (id: number) => {
  // La relación con Producto impide eliminar marcas que todavía tengan productos.
  return prisma.marca.delete({ where: { id } });
};

//Aca hablamos con Prisma directamente. Si llegamos a cambiar de ORM, solo tocás esta capa.
