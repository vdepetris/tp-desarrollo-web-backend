export class AppError extends Error {
  status: number;

  constructor(status: number, mensaje: string) {
    super(mensaje);       // guarda el mensaje en error.message
    this.status = status; // el código HTTP que queremos devolver
    this.name = "AppError";
  }
}
// Esta clase se puede usar para lanzar errores personalizados en la aplicación, con un código de estado HTTP y un mensaje específico. Por ejemplo:
// throw new AppError(404, "Recurso no encontrado");