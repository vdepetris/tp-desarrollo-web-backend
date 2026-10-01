/*
  Warnings:

  - You are about to alter the column `precioUnitario` on the `itempedido` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `estado` on the `pedido` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.
  - You are about to alter the column `total` on the `pedido` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `precio` on the `producto` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `rol` on the `usuario` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `itempedido` MODIFY `precioUnitario` DECIMAL(10, 2) NOT NULL;

-- AlterTable
ALTER TABLE `pedido` MODIFY `estado` ENUM('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado') NOT NULL DEFAULT 'pendiente',
    MODIFY `total` DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `producto` MODIFY `precio` DECIMAL(10, 2) NOT NULL;

-- AlterTable
ALTER TABLE `usuario` MODIFY `rol` ENUM('cliente', 'admin') NOT NULL DEFAULT 'cliente';
