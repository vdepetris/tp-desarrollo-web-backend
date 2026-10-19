import { Router } from "express";
import * as usuarioController from "../controllers/usuario.controller";

import { requiereSesion, requiereAdmin } from "../middlewares/auth";

const router = Router();

// Estas rutas van antes de /:id para que no se interpreten como identificadores.
router.get("/sesion", requiereSesion, (req, res) => res.json(req.session.usuario));
router.post("/logout", (req, res, next) => {
  req.session.destroy(error => {
    if (error) return next(error);
    res.clearCookie("connect.sid");
    res.sendStatus(204);
  });
});

// Verifica las credenciales enviadas por el formulario de acceso.
router.post("/login", usuarioController.loginUsuario);
router.get("/", requiereAdmin, usuarioController.getUsuarios);
router.get("/:id", requiereAdmin, usuarioController.getUsuarioPorId);
router.post("/", usuarioController.postUsuario);
router.put("/:id", requiereAdmin, usuarioController.putUsuario);
router.delete("/:id", requiereAdmin, usuarioController.deleteUsuario);

export default router;
