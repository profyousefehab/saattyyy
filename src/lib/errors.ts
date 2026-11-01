export class AppError extends Error {}

export function getErrorMessage(error: unknown): string {
  return error instanceof AppError ? error.message : 'حصلت مشكلة غير متوقعة، حاول تاني';
}
