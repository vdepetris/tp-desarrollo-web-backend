import { EstadoPedido } from "@prisma/client";
import { Request, Response } from "express";
import * as pedidoService from "../services/pedido.service";
import * as usuarioService from "../services/usuario.service";
import { AppError } from "../errors/AppError";
import { leerId } from "../utils/leerId";

/*
  CAPA DE CONTROLLER - PEDIDO
  ---------------------------
  Acá validamos lo que manda el cliente. La lógica de negocio
  (precios, stock, total, transacción) vive en el service.
*/


// La lista sale del enum del schema: si agregamos un estado allá, acá se actualiza solo.
const ESTADOS_VALIDOS: string[] = Object.values(EstadoPedido);


// GET /pedidos
export const getPedidos = async (req: Request, res: Response) => {
  const pedidos = await pedidoService.listarPedidos();
  res.json(pedidos);
};

// GET /pedidos/:id
export const getPedidoPorId = async (req: Request, res: Response) => {
  const id = leerId(req);
  const pedido = await pedidoService.obtenerPedidoPorId(id);

  if (!pedido) {
    throw new AppError(404, "Pedido no encontrado");
  }

  res.json(pedido);
};

// POST /pedidos
// Body: { usuarioId: 1, items: [{ productoId: 1, cantidad: 2 }] }
export const postPedido = async (req: Request, res: Response) => {
  // TODO: cuando esté el login, usuarioId sale del token y no del body.
  const { usuarioId, items } = req.body ?? {};
  const errores: string[] = [];

  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    errores.push("El usuarioId es obligatorio");
  }

  if (!Array.isArray(items) || items.length === 0) {
    errores.push("El pedido debe tener al menos un item");
  } else {
    // Guardamos los productoId que ya vimos para detectar repetidos.
    const vistos = new Set<number>();

    items.forEach((item: any, i: number) => {
      const n = i + 1; // para que el mensaje diga "Item 1" y no "Item 0"

      if (!Number.isInteger(item?.productoId) || item.productoId <= 0) {
        errores.push(`Item ${n}: productoId inválido`);
      } else if (vistos.has(item.productoId)) {
        errores.push(`Item ${n}: el producto ${item.productoId} está repetido`);
      } else {
        vistos.add(item.productoId);
      }

      if (!Number.isInteger(item?.cantidad) || item.cantidad <= 0) {
        errores.push(`Item ${n}: la cantidad debe ser un entero mayor a 0`);
      }
    });
  }

  if (errores.length > 0) {
    throw new AppError(400, errores.join(". "));
  }

  // Si el usuario no existe, Prisma tiraría P2003 (409). Pero es un dato mal
  // mandado por el cliente, así que lo chequeamos antes y respondemos 400.
  const usuario = await usuarioService.obtenerUsuarioPorId(usuarioId);
  if (!usuario) {
    throw new AppError(400, "El usuario indicado no existe");
  }

  // Nos quedamos solo con productoId y cantidad. Si el cliente manda un
  // precio, se ignora: el precio lo toma el service de la base de datos.
  const itemsLimpios = items.map((item: any) => ({
    productoId: item.productoId,
    cantidad: item.cantidad,
  }));

  const pedido = await pedidoService.crearPedido(usuarioId, itemsLimpios);
  res.status(201).json(pedido);
};

// PATCH /pedidos/:id/estado
// Body: { estado: "enviado" }
export const patchEstadoPedido = async (req: Request, res: Response) => {
  const id = leerId(req);
  const { estado } = req.body ?? {};

  if (typeof estado !== "string" || !ESTADOS_VALIDOS.includes(estado)) {
    throw new AppError(400, `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}`);
  }

  // Ya validamos arriba que está en la lista, así que le decimos a TypeScript
  // que lo trate como EstadoPedido.
  // Si el pedido no existe, Prisma tira P2025 y el errorHandler responde 404.
  const pedido = await pedidoService.actualizarEstadoPedido(id, estado as EstadoPedido);

  res.json(pedido);
};

// PUT /pedidos/:id
// Body: { estado: "enviado" }. Lo único modificable de un pedido es su estado
// (items y total quedan fijos), así que hace lo mismo que el PATCH.
export const putPedido = patchEstadoPedido;

// DELETE /pedidos/:id
export const deletePedido = async (req: Request, res: Response) => {
  const id = leerId(req);
  await pedidoService.eliminarPedido(id);
  res.status(204).send();
};
