import { Router } from "express";
import * as pedidoController from "../controllers/pedido.controller";

import { requiereSesion, requiereAdmin } from "../middlewares/auth";

const router = Router();

router.get("/", requiereSesion, pedidoController.getPedidos);
router.get("/:id", requiereSesion, pedidoController.getPedidoPorId);
router.post("/", requiereSesion, pedidoController.postPedido);
router.patch("/:id/estado", requiereAdmin, pedidoController.patchEstadoPedido);
router.put("/:id", requiereAdmin, pedidoController.putPedido);
router.delete("/:id", requiereAdmin, pedidoController.deletePedido);

export default router;
