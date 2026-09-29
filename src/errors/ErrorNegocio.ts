import { AppError } from "./AppError";

// Error de negocio: la request está bien formada, pero choca con
// el estado actual de los datos. Siempre responde 409 Conflict.
export class ErrorNegocio extends AppError {
  constructor(mensaje: string) {
    super(409, mensaje);
    this.name = "ErrorNegocio";
  }
}

// Caso puntual: se pide más cantidad de la que hay en stock.
export class StockInsuficienteError extends ErrorNegocio {
  constructor(nombreProducto: string) {
    super(`Stock insuficiente para el producto ${nombreProducto}`);
    this.name = "StockInsuficienteError";
  }
}
