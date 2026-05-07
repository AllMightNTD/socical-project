export interface ApiResponse<T> {
  data: T;
  status: number | boolean;
  message?: string;
}

export function successResponse<T>(
  data: T,
  message = 'Success',
): ApiResponse<T> {
  return {
    status: 200,
    message,
    data,
  };
}

export function errorResponse(
  message = 'Error',
  data: any = null,
): ApiResponse<any> {
  return {
    status: 400,
    message,
    data,
  };
}
