import { Request, Response } from "express";
import * as categoriaService from "../services/categoria.service";
import { mapPrismaError } from "../utils/prismaError";

/*
  CAPA DE CONTROLLER
  ------------------
  Su única responsabilidad es traducir entre HTTP y el service:
    1. Leer lo que llega del cliente (req.params, req.body)
    2. Validar que sea usable ANTES de tocar la base de datos
    3. Traducir el resultado (o el error) a un status code + JSON

  Toda la lógica de acceso a datos vive en categoria.service.ts.
  Acá no se llama a Prisma directamente: si mañana cambiáramos de ORM,
  este archivo no se tocaría.
*/

// GET /categorias
export const getCategorias = async (req: Request, res: Response) => {
  try {
    const categorias = await categoriaService.listarCategorias();
    res.json(categorias);
  } catch (error) {
    console.error(error);   // ← agregá esto
    res.status(500).json({ error: "Error al listar las categorías" });
  }
};

// GET /categorias/:id
export const getCategoriaPorId = async (req: Request, res: Response) => {
  try {
    // Todo lo que viene en la URL es string. Number("abc") da NaN,
    // y si ese NaN llega a Prisma revienta con un error poco claro.
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      // Ojo: Number("") da 0, por eso además de entero validamos que sea > 0.
      res.status(400).json({ error: "El id debe ser un número entero positivo" });
      return;
    }

    const categoria = await categoriaService.obtenerCategoriaPorId(id);

    // findUnique NO lanza error cuando no encuentra: devuelve null.
    // Por eso el 404 lo chequeamos a mano acá y no en el catch.
    if (!categoria) {
      res.status(404).json({ error: "Categoría no encontrada" });
      return;
    }

    res.json(categoria);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la categoría" });
  }
};

// POST /categorias
export const postCategoria = async (req: Request, res: Response) => {
  try {
    const { nombre } = req.body;

    /*
      Validamos el TIPO, no solo la existencia.
      Un simple `if (!nombre)` dejaría pasar dos casos malos:
        - "   " (espacios) es truthy, y guardaríamos una categoría vacía
        - 123 es truthy, y guardaríamos un número donde va texto
    */
    if (typeof nombre !== "string" || nombre.trim() === "") {
      res.status(400).json({ error: "El nombre es obligatorio" });
      return;
    }

    // trim() para no guardar espacios sobrantes al principio o al final.
    const nueva = await categoriaService.crearCategoria({ nombre: nombre.trim() });

    // 201 = Created. Devolvemos el objeto creado para que el front tenga el id.
    res.status(201).json(nueva);
  } catch (error) {
    /*
      mapPrismaError traduce los códigos P2xxx de Prisma a status HTTP.
      Acá el caso típico es P2002 (índice único) si el nombre ya existe → 409.
    */
    const conocido = mapPrismaError(error);
    if (conocido) {
      res.status(conocido.status).json({ error: conocido.message });
      return;
    }
    res.status(500).json({ error: "Error al crear la categoría" });
  }
};

// PUT /categorias/:id
export const putCategoria = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "El id debe ser un número entero positivo" });
      return;
    }

    const { nombre } = req.body;
    if (typeof nombre !== "string" || nombre.trim() === "") {
      res.status(400).json({ error: "El nombre es obligatorio" });
      return;
    }

    const actualizada = await categoriaService.actualizarCategoria(id, nombre.trim());
    res.json(actualizada);
  } catch (error) {
    /*
      A diferencia de findUnique, el update SÍ lanza error si el id no existe:
      es el código P2025, que mapPrismaError convierte en 404.
      Sin este catch, la promesa quedaría rechazada y la request se colgaría.
    */
    const conocido = mapPrismaError(error);
    if (conocido) {
      // Personalizamos el mensaje genérico de mapPrismaError para esta entidad.
      const mensaje =
        conocido.status === 404 ? "Categoría no encontrada" : conocido.message;
      res.status(conocido.status).json({ error: mensaje });
      return;
    }
    res.status(500).json({ error: "Error al actualizar la categoría" });
  }
};

// DELETE /categorias/:id
export const deleteCategoria = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "El id debe ser un número entero positivo" });
      return;
    }

    await categoriaService.eliminarCategoria(id);

    // 204 = No Content: la operación salió bien y no hay nada que devolver.
    // Por eso usamos .send() y no .json().
    res.status(204).send();
  } catch (error) {
    const conocido = mapPrismaError(error);
    if (conocido) {
      /*
          - P2025 (404): la categoría no existe
          - P2003 (409): la categoría existe pero tiene productos asociados,
            y MySQL bloquea el borrado por la foreign key.
        Son errores distintos y el cliente necesita poder diferenciarlos.
      */
      const mensaje =
        conocido.status === 409
          ? "No se puede eliminar una categoría que tiene productos asociados"
          : "Categoría no encontrada";
      res.status(conocido.status).json({ error: mensaje });
      return;
    }
    res.status(500).json({ error: "Error al eliminar la categoría" });
  }
};