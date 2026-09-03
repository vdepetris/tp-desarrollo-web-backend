import { Router } from "express";
import * as categoriaController from "../controllers/categoria.controller";

const router = Router();

router.get("/", categoriaController.getCategorias);
router.get("/:id", categoriaController.getCategoriaPorId);
router.post("/", categoriaController.postCategoria);
router.put("/:id", categoriaController.putCategoria);
router.delete("/:id", categoriaController.deleteCategoria);

export default router;