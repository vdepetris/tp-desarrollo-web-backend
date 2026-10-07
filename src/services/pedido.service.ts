import { EstadoPedido, Prisma } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { StockInsuficienteError } from "../errors/ErrorNegocio";
import prisma from "../config/prisma";

// Forma en la que el controller nos va a mandar los items al crear un pedido.
type ItemInput = {
  productoId: number;
  cantidad: number;
};

export const listarPedidos = async () => {
  return prisma.pedido.findMany({
        include: {
      items: { include: { producto: true } },
      usuario: { select: { id: true, nombre: true, email: true } },
    },

  });
};

export const obtenerPedidoPorId = async (id: number) => {
  return prisma.pedido.findUnique({
    where: { id },
        include: {
      items: { include: { producto: true } },
      usuario: { select: { id: true, nombre: true, email: true } },
    },

  });
};

export const crearPedido = async (usuarioId: number, items: ItemInput[]) => {
  // Todo esto tiene que pasar junto o no pasar nada:
  // si falla el descuento de stock de un producto, no queremos un pedido a medias.
  return prisma.$transaction(async (tx) => {
    let total = new Prisma.Decimal(0);
    const itemsData = [];

        for (const item of items) {
      // Lo buscamos para saber si existe y para tomar su precio y su nombre.
      const producto = await tx.producto.findUnique({
        where: { id: item.productoId },
      });

      if (!producto) {
        throw new AppError(404, `Producto ${item.productoId} no existe`);
      }

      // Chequeo y descuento en UNA sola operación atómica:
      // UPDATE producto SET stock = stock - cantidad WHERE id = ? AND stock >= cantidad
      const resultado = await tx.producto.updateMany({
        where: { id: item.productoId, stock: { gte: item.cantidad } },
        data: { stock: { decrement: item.cantidad } },
      });

      // count = cantidad de filas modificadas. Si es 0, no alcanzaba el stock
      // (aunque otro pedido lo haya comprado un instante antes).
      if (resultado.count === 0) {
        throw new StockInsuficienteError(producto.nombre);
      }

      const precioUnitario = producto.precio;
      // Sumamos con Decimal y no con Number para no tener errores de redondeo.
      total = total.add(precioUnitario.mul(item.cantidad));
      

      itemsData.push({
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario,
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
  
export const actualizarEstadoPedido = async (id: number, estado: EstadoPedido) => {
  return prisma.pedido.update({ where: { id }, data: { estado } });
};

export const eliminarPedido = async (id: number) => {
  // Los items referencian al pedido, así que se borran primero (todo o nada).
  // Si el pedido no existe, delete tira P2025 y se revierte la transacción.
  return prisma.$transaction(async (tx) => {
    await tx.itemPedido.deleteMany({ where: { pedidoId: id } });
    return tx.pedido.delete({ where: { id } });
  });
};
