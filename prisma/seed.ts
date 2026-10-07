import "dotenv/config";
import { EstadoPedido, Prisma, Rol } from "@prisma/client";
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

  // Más clientes para que los pedidos tengan variedad.
  const clientes = [
    { nombre: "Juan Pérez", email: "juan@tienda.com" },
    { nombre: "María Gómez", email: "maria@tienda.com" },
    { nombre: "Lucas Fernández", email: "lucas@tienda.com" },
    { nombre: "Sofía Díaz", email: "sofia@tienda.com" },
  ];

  for (const cliente of clientes) {
    await prisma.usuario.upsert({
      where: { email: cliente.email },
      update: {},
      create: { ...cliente, password: "cliente123", rol: Rol.cliente },
    });
  }

  // Pedidos de ejemplo. No tienen campo único, así que solo se cargan si no hay ninguno.
  // Se crean directo (sin pasar por crearPedido), por lo que no descuentan stock.
  if ((await prisma.pedido.count()) === 0) {
    const pedidosEjemplo = [
      { email: "juan@tienda.com", estado: EstadoPedido.entregado, diasAtras: 9, items: [["Whey Protein 1kg", 1], ["Creatina Monohidrato 300g", 1]] },
      { email: "maria@tienda.com", estado: EstadoPedido.pendiente, diasAtras: 1, items: [["Multivitamínico 60 caps", 2]] },
      { email: "lucas@tienda.com", estado: EstadoPedido.enviado, diasAtras: 3, items: [["Whey Protein Isolate 900g", 1], ["Omega 3 90 caps", 2]] },
      { email: "sofia@tienda.com", estado: EstadoPedido.cancelado, diasAtras: 6, items: [["Proteína Vegana 1kg", 1]] },
      { email: "cliente@tienda.com", estado: EstadoPedido.pagado, diasAtras: 2, items: [["Creatina Monohidrato 500g", 2], ["Omega 3 90 caps", 1]] },
      { email: "juan@tienda.com", estado: EstadoPedido.pendiente, diasAtras: 0, items: [["Whey Protein 1kg", 2]] },
    ] as const;

    for (const pedido of pedidosEjemplo) {
      const usuario = await prisma.usuario.findUniqueOrThrow({ where: { email: pedido.email } });

      // Tomamos el precio actual de cada producto, igual que hace crearPedido.
      let total = new Prisma.Decimal(0);
      const items: Prisma.ItemPedidoUncheckedCreateWithoutPedidoInput[] = [];
      for (const [nombre, cantidad] of pedido.items) {
        const producto = await prisma.producto.findFirstOrThrow({ where: { nombre } });
        total = total.add(producto.precio.mul(cantidad));
        items.push({ productoId: producto.id, cantidad, precioUnitario: producto.precio });
      }

      await prisma.pedido.create({
        data: {
          usuarioId: usuario.id,
          estado: pedido.estado,
          total,
          fecha: new Date(Date.now() - pedido.diasAtras * 24 * 60 * 60 * 1000),
          items: { create: items },
        },
      });
    }
  }

  console.log("Seed completado");
}

main().finally(() => prisma.$disconnect());
