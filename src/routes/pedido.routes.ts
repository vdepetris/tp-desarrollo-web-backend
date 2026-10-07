import { Router } from "express";
import * as pedidoController from "../controllers/pedido.controller";

const router = Router();

router.get("/", pedidoController.getPedidos);
router.get("/:id", pedidoController.getPedidoPorId);
router.post("/", pedidoController.postPedido);
router.patch("/:id/estado", pedidoController.patchEstadoPedido);
router.put("/:id", pedidoController.putPedido);
router.delete("/:id", pedidoController.deletePedido);

export default router;
