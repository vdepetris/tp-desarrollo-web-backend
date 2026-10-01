import { Router } from "express";
import * as usuarioController from "../controllers/usuario.controller";

const router = Router();

router.get("/", usuarioController.getUsuarios);
router.get("/:id", usuarioController.getUsuarioPorId);
router.post("/", usuarioController.postUsuario);
router.put("/:id", usuarioController.putUsuario);
router.delete("/:id", usuarioController.deleteUsuario);

export default router;
