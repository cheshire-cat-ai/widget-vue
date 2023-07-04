/**
 * The structure of the generic JSON that arrives when adding new values
 */
export interface JSONResponse<T> {
  readonly status: 'error' | 'success'
  readonly message: string
  readonly data?: T
}