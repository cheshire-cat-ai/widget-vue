/**
 * This module defines and export a collection of functions that are related to error management or error manipulation
 * commonly used throughout the application.
 */
import { isError, isErrorLikeObject, isString } from '@utils/typeGuards'

/**
 * An enumerator of error codes to error messages.
 */
export enum ErrorCode {
  IndexError = 'Something went wrong while processing your message. Please try again later.',
  SocketClosed = 'The connection to the server was closed. Please try refreshing the page.',
  WebSocketConnectionError = 'Something went wrong while connecting to the server. Please try again later.',
  APIError = 'Something went wrong while sending your message. Please try refreshing the page.'
}

/**
 * Returns the error message from an error or error-like object.
 * If the value is not an error or error-like object, the unknownError argument is returned.
 */
export const getErrorMessage = (error: unknown, unknownError = 'Unknown error'): string => {
  if (isString(error)) return error
  if (isError(error) || isErrorLikeObject(error)) return error.message

  return unknownError
}
