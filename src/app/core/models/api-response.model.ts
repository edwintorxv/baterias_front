/** Respuesta exitosa del backend (ApiResponse). */
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    timestamp: string;
}

/** Respuesta de error del backend (ApiError): 400, 401, 403, 404, 409, 429, 500. */
export interface ApiError {
    success: false;
    message: string;
    errorCode: string;
    details: string[] | null;
    timestamp: string;
}
