import { Router } from "express";
import * as marcaController from "../controllers/marca.controller";

const router = Router();

router.get("", marcaController.getMarcas);


export default router;
