import "dotenv/config";
import { Rol } from "@prisma/client";
import prisma from "../src/config/prisma";

/*
  SEED: carga datos de ejemplo en la base.
  Se corre con: npx prisma db seed

  Usa upsert para que se pueda correr varias veces sin duplicar nada:
  si el registro ya existe (por su campo único) no lo toca, y si no existe lo crea.
*/

const catalogo = [
  {
    categoria: "Proteínas",
    productos: [
      { nombre: "Whey Protein 1kg", descripcion: "Proteína de suero sabor chocolate", precio: 32000, stock: 25 },
      { nombre: "Whey Protein Isolate 900g", descripcion: "Proteína aislada sabor vainilla", precio: 45500.5, stock: 12 },
      { nombre: "Proteína Vegana 1kg", descripcion: "Mezcla de arveja y arroz", precio: 29990, stock: 8 },
    ],
  },
  {
    categoria: "Creatinas",
    productos: [
      { nombre: "Creatina Monohidrato 300g", descripcion: "Creatina micronizada sin sabor", precio: 18500, stock: 40 },
      { nombre: "Creatina Monohidrato 500g", descripcion: "Creatina micronizada sin sabor", precio: 27000, stock: 20 },
    ],
  },
  {
    categoria: "Vitaminas",
    productos: [
      { nombre: "Multivitamínico 60 caps", descripcion: "Vitaminas y minerales", precio: 9800, stock: 30 },
      { nombre: "Omega 3 90 caps", descripcion: "Aceite de pescado", precio: 12450.75, stock: 15 },
    ],
  },
  {
    categoria: "Pre-entrenos",
    productos: [
      { nombre: "Pre-entreno 300g", descripcion: "Con cafeína y beta alanina", precio: 21000, stock: 0 },
    ],
  },
];

async function main() {
  // Categorías con sus productos.
  // Si la categoría ya existe, update: {} no cambia nada y los productos no se vuelven a crear.
  for (const { categoria, productos } of catalogo) {
    await prisma.categoria.upsert({
      where: { nombre: categoria },
      update: {},
      create: {
        nombre: categoria,
        productos: { create: productos },
      },
    });
  }

  // Usuarios de prueba. El email es único, así que sirve para el upsert.
  // TODO: cuando hagamos el login, los passwords se guardan hasheados con bcrypt.
  await prisma.usuario.upsert({
    where: { email: "admin@tienda.com" },
    update: {},
    create: { nombre: "Admin", email: "admin@tienda.com", password: "admin123", rol: Rol.admin },
  });

  await prisma.usuario.upsert({
    where: { email: "cliente@tienda.com" },
    update: {},
    create: { nombre: "Cliente Prueba", email: "cliente@tienda.com", password: "cliente123", rol: Rol.cliente },
  });

  console.log("Seed completado");
}

main().finally(() => prisma.$disconnect());
