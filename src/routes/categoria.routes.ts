import { Router } from "express";
import * as categoriaController from "../controllers/categoria.controller";

import { requiereSesion, requiereAdmin } from "../middlewares/auth";

const router = Router();

router.get("/", categoriaController.getCategorias);
router.get("/:id", categoriaController.getCategoriaPorId);
router.post("/", requiereAdmin, categoriaController.postCategoria);
router.put("/:id", requiereAdmin, categoriaController.putCategoria);
router.delete("/:id", requiereAdmin, categoriaController.deleteCategoria);

export default router;