-- AlterTable
ALTER TABLE `Categoria` ADD COLUMN `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo';
