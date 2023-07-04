import { AxiosError } from "axios"
import type { JSONResponse } from "@models/JSONSchema"
import { capitalize } from "lodash"
import { ApiError } from 'ccat-api'
import type { CatClient, CancelablePromise } from 'ccat-api'

export const Features = ['record', 'web', 'file', 'memory', 'reset'] as const

/**
 * API client to make requests to the endpoints and passing the API_KEY for authentication.
 */
export let apiClient: CatClient

export const updateClient = (client: CatClient) => {
    apiClient = client
}

/**
 * A function that wraps the promise request into a try/catch block
 * and check for errors to throw to the UI
 * @param request The axios promise function to await
 * @param success The message to return in case of success
 * @param error The message to return in case of error
 * @param log The log message/array of stuff to show
 * @returns A JSONResponse object containing status, message and optionally a data property
 */
export const tryRequest = async <T>(
    request: CancelablePromise<T>,
    success: string,
    error: string
) => {
    try {
        const result = (await request) as T

        return {
            status: 'success',
            message: success,
            data: result
        } as JSONResponse<T>
    } catch (err) {
        if (err instanceof AxiosError) {
            error = capitalize(err.message)
            if (err.code === "ERR_NETWORK") throw "Network error for"
            else if (err.code !== "ECONNABORTED") throw "Failed to fetch"
        }
        if (err instanceof ApiError) {
            throw "Failed to fetch"
        }
        return {
            status: 'error',
            message: error
        } as JSONResponse<T>
    }
}