import { Request, Response } from "express";
import * as productoService from "../services/producto.service";
import { mapPrismaError } from "../utils/prismaError";

/*
  CAPA DE CONTROLLER - PRODUCTO
  -----------------------------
  Producto es un CRUD dependiente: no puede existir sin una Categoria.
  Esa dependencia agrega dos casos de error que Categoria no tiene:
    - Al crear/actualizar: la categoriaId puede apuntar a una categoría inexistente
    - Al eliminar: el producto puede estar referenciado en ItemPedido
  Los dos los reporta MySQL como violación de foreign key (código P2003).
*/

// GET /productos
export const getProductos = async (req: Request, res: Response) => {
  try {
    // El service usa include: { categoria: true }, así que cada producto
    // viene con su categoría completa anidada, no solo el categoriaId.
    const productos = await productoService.listarProductos();
    res.json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al listar los productos" });
  }
};

// GET /productos/:id
export const getProductoPorId = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "El id debe ser un número entero positivo" });
      return;
    }

    const producto = await productoService.obtenerProductoPorId(id);

    // findUnique devuelve null si no encuentra, no lanza error.
    if (!producto) {
      res.status(404).json({ error: "Producto no encontrado" });
      return;
    }

    res.json(producto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el producto" });
  }
};

// POST /productos
export const postProducto = async (req: Request, res: Response) => {
  try {
    const { nombre, descripcion, precio, stock, categoriaId } = req.body ?? {};

    /*
      Acumulamos los errores en un array en vez de cortar en el primero,
      así el cliente ve todos los problemas de una sola vez y no tiene que
      ir corrigiendo de a un campo por request.
    */
    const errores: string[] = [];

    if (typeof nombre !== "string" || nombre.trim() === "") {
      errores.push("El nombre es obligatorio");
    }
    if (typeof precio !== "number" || precio <= 0) {
      errores.push("El precio debe ser un número mayor a 0");
    }
    // Number.isInteger rechaza decimales: no existe medio producto en stock.
    if (!Number.isInteger(stock) || stock < 0) {
      errores.push("El stock debe ser un entero mayor o igual a 0");
    }
    if (!Number.isInteger(categoriaId) || categoriaId <= 0) {
      errores.push("La categoría es obligatoria");
    }
    // descripcion es opcional en el schema, pero si viene tiene que ser texto.
    if (descripcion !== undefined && typeof descripcion !== "string") {
      errores.push("La descripción debe ser texto");
    }

    if (errores.length > 0) {
      res.status(400).json({ errores });
      return;
    }

    const nuevo = await productoService.crearProducto({
      nombre: nombre.trim(),
      descripcion,
      precio,
      stock,
      categoriaId,
    });

    res.status(201).json(nuevo);
  } catch (error) {
    console.error(error);
    const conocido = mapPrismaError(error);
    if (conocido) {
      /*
        Acá un P2003 (409 genérico) significa algo puntual: la categoriaId
        que mandaron no existe en la tabla Categoria. Eso es culpa del cliente
        por mandar un dato inválido, así que lo devolvemos como 400 y no 409.
      */
      if (conocido.status === 409) {
        res.status(400).json({ error: "La categoría indicada no existe" });
        return;
      }
      res.status(conocido.status).json({ error: conocido.message });
      return;
    }
    res.status(500).json({ error: "Error al crear el producto" });
  }
};

// PUT /productos/:id
export const putProducto = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "El id debe ser un número entero positivo" });
      return;
    }

    const { nombre, descripcion, precio, stock, categoriaId } = req.body ?? {};
    const errores: string[] = [];

    /*
      A diferencia del POST, acá la actualización es parcial: el cliente puede
      mandar solo el precio, o solo el stock. Por eso armamos el objeto `data`
      únicamente con los campos que efectivamente llegaron, y validamos cada uno
      solo si vino. Un campo ausente no es un error, es "no lo quiero tocar".
    */
    const data: Record<string, unknown> = {};

    if (nombre !== undefined) {
      if (typeof nombre !== "string" || nombre.trim() === "") {
        errores.push("El nombre no puede estar vacío");
      } else {
        data.nombre = nombre.trim();
      }
    }
    if (precio !== undefined) {
      if (typeof precio !== "number" || precio <= 0) {
        errores.push("El precio debe ser un número mayor a 0");
      } else {
        data.precio = precio;
      }
    }
    if (stock !== undefined) {
      if (!Number.isInteger(stock) || stock < 0) {
        errores.push("El stock debe ser un entero mayor o igual a 0");
      } else {
        data.stock = stock;
      }
    }
    if (categoriaId !== undefined) {
      if (!Number.isInteger(categoriaId) || categoriaId <= 0) {
        errores.push("La categoría no es válida");
      } else {
        data.categoriaId = categoriaId;
      }
    }
    if (descripcion !== undefined) {
      if (typeof descripcion !== "string") {
        errores.push("La descripción debe ser texto");
      } else {
        data.descripcion = descripcion;
      }
    }

    if (errores.length > 0) {
      res.status(400).json({ errores });
      return;
    }

    // Si mandaron un body vacío, avisamos en vez de hacer un update sin cambios.
    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: "No se envió ningún campo para actualizar" });
      return;
    }

    const actualizado = await productoService.actualizarProducto(id, data);
    res.json(actualizado);
  } catch (error) {
    console.error(error);
    const conocido = mapPrismaError(error);
    if (conocido) {
      // P2025 (404) = el producto no existe.
      // P2003 (409) = la categoriaId nueva no existe → es culpa del cliente, 400.
      if (conocido.status === 409) {
        res.status(400).json({ error: "La categoría indicada no existe" });
        return;
      }
      const mensaje =
        conocido.status === 404 ? "Producto no encontrado" : conocido.message;
      res.status(conocido.status).json({ error: mensaje });
      return;
    }
    res.status(500).json({ error: "Error al actualizar el producto" });
  }
};

// DELETE /productos/:id
export const deleteProducto = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "El id debe ser un número entero positivo" });
      return;
    }

    await productoService.eliminarProducto(id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    const conocido = mapPrismaError(error);
    if (conocido) {
      /*
        Acá el P2003 sí es un 409 legítimo: el producto existe y el id es válido,
        pero está referenciado en algún ItemPedido y MySQL bloquea el borrado.
        No es un dato mal mandado, es un conflicto con el estado actual de la base.
      */
      const mensaje =
        conocido.status === 409
          ? "No se puede eliminar un producto que forma parte de un pedido"
          : "Producto no encontrado";
      res.status(conocido.status).json({ error: mensaje });
      return;
    }
    res.status(500).json({ error: "Error al eliminar el producto" });
  }
};