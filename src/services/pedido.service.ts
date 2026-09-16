import prisma from "../config/prisma";

// Forma en la que el controller nos va a mandar los items al crear un pedido.
type ItemInput = {
  productoId: number;
  cantidad: number;
};

export const listarPedidos = async () => {
  return prisma.pedido.findMany({
    include: { items: { include: { producto: true } }, usuario: true },
  });
};

export const obtenerPedidoPorId = async (id: number) => {
  return prisma.pedido.findUnique({
    where: { id },
    include: { items: { include: { producto: true } }, usuario: true },
  });
};

export const crearPedido = async (usuarioId: number, items: ItemInput[]) => {
  // Todo esto tiene que pasar junto o no pasar nada:
  // si falla el descuento de stock de un producto, no queremos un pedido a medias.
  return prisma.$transaction(async (tx) => {
    let total = 0;
    const itemsData = [];

    for (const item of items) {
      const producto = await tx.producto.findUnique({
        where: { id: item.productoId },
      });

      if (!producto) {
        throw new Error(`Producto ${item.productoId} no existe`);
      }
      if (producto.stock < item.cantidad) {
        throw new Error(`Stock insuficiente para el producto ${producto.nombre}`);
      }

      const precioUnitario = producto.precio;
      total += Number(precioUnitario) * item.cantidad;

      itemsData.push({
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario,
      });

      await tx.producto.update({
        where: { id: item.productoId },
        data: { stock: producto.stock - item.cantidad },
      });
    }

    return tx.pedido.create({
      data: {
        usuarioId,
        total,
        items: { create: itemsData },
      },
      include: { items: true },
    });
  });
};

export const actualizarEstadoPedido = async (id: number, estado: string) => {
  return prisma.pedido.update({ where: { id }, data: { estado } });
};

export const eliminarPedido = async (id: number) => {
  return prisma.pedido.delete({ where: { id } });
};
