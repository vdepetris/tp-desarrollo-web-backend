import { Router } from "express";
import * as marcaController from "../controllers/marca.controller";

import { requiereSesion, requiereAdmin } from "../middlewares/auth";

const router = Router();

router.get("/", marcaController.getMarcas);
router.get("/:id", marcaController.getMarcaPorId);
router.post("/", requiereAdmin, marcaController.postMarca);
router.put("/:id", requiereAdmin, marcaController.putMarca);
router.delete("/:id", requiereAdmin, marcaController.deleteMarca);

export default router;