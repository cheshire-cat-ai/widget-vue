/**
 * This module defines and exports a service that is used to send files to the backend.
 * A service is a singleton object that provides a simple interface for performing backend-related tasks such as
 * sending or receiving data.
 */
import { toJSON } from '@utils/commons'
import { authFetch, getConfig } from '@/config'

/*
 * This service is used to send files down to the rabbit hole.
 * Meaning this service sends files to the backend.
 */
const RabbitHoleService = Object.freeze({
  sendFile: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const options = { method: 'POST', body: formData }

    return await authFetch(getConfig().endpoints.rabbitHole, options).then<RabbitHoleFileResponse>(toJSON)
  },
  sendWeb: async (url: string) => {
    const options = { 
      method: 'POST', 
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }) 
    }

    return await authFetch(getConfig().endpoints.rabbitHole.concat('web/'), options).then<RabbitHoleWebResponse>(toJSON)
  },
})

export const AcceptedContentTypes = ['text/plain', 'text/markdown', 'application/pdf'] as const

export interface RabbitHoleFileResponse {
  'Content-Type': typeof AcceptedContentTypes[number]
  filename: string
  info: string
}

export interface RabbitHoleWebResponse {
  url: string
  info: string
}

export default RabbitHoleService
