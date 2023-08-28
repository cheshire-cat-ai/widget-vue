import type { JSONResponse } from "@models/JSONSchema"
import type { CatClient, CancelablePromise } from 'ccat-api'
import { getErrorMessage } from "@utils/errors"

export const Features = ['record', 'web', 'file', 'memory', 'reset'] as const
export type Feature = typeof Features[number]

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
 * @returns A JSONResponse object containing status, message and optionally a data property
 */
export const tryRequest = async <T>(
	request: CancelablePromise<T> | undefined,
	success: string,
	error: string,
) => {
	try {
		if (request == undefined) throw new Error('Failed to reach the endpoint')

		const result = (await request) as T

		return {
			status: 'success',
			message: success,
			data: result,
		} as JSONResponse<T>
	} catch (err) {
		return {
			status: 'error',
			message: getErrorMessage(err, error),
		} as JSONResponse<T>
	}
}