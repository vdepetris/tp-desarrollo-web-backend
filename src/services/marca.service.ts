import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";

export const getMarcas = async () => {
    return await prisma.marca.findMany()
};  


export const crearMarca = (data: {
  nombre: string;
  descripcion?: string;
  origen?: string;
}) => prisma.marca.create({ data });

