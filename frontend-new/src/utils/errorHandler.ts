/**
 * Utility function to extract error messages from API responses
 * Handles FastAPI validation errors (Pydantic)
 */

interface ValidationError {
  type?: string;
  loc?: string[];
  msg: string;
  input?: any;
}

export const extractErrorMessage = (error: any, fallbackMessage: string = 'Une erreur est survenue'): string => {
  if (!error.response?.data?.detail) {
    return fallbackMessage;
  }

  const detail = error.response.data.detail;

  if (Array.isArray(detail)) {
    return detail.map((e: ValidationError) => e.msg).join(', ');
  }

  if (typeof detail === 'object' && detail !== null) {
    return detail.msg || fallbackMessage;
  }

  if (typeof detail === 'string') {
    return detail;
  }

  return fallbackMessage;
};
