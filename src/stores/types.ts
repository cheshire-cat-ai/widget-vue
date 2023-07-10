import type { FileResponse, WebResponse } from 'ccat-api'
import type { Message } from '@models/Message'
import type { Notification } from '@models/Notification'

/**
 * Defines a generic interface for defining the state of an asynchronous operation.
 */
export interface AsyncStateBase {
  loading: boolean
  error?: string
}

/**
 * Defines a generic interface for defining the state of an asynchronous operation that returns data.
 */
export interface AsyncState<TData> extends AsyncStateBase {
  data?: TData
}

export type RabbitHoleResponse = FileResponse | WebResponse | Record<string, unknown>

/**
 * Defines the structure of the 'fileUploader' state.
 * This state contains information about the last file that the user has sent to the bot as well as the response form the server.
 * It extends the AsyncState interface, which defines the structure of the state of an asynchronous operation.
 */
export type FileUploaderState = AsyncState<RabbitHoleResponse>

/**
 * Defines the structure of the 'messages' state.
 * This state contains information about the messages sent by the user and the bot,
 * as well as a list of default messages that can be sent by the user.
 * It extends the AsyncStateBase interface, which defines the structure of the state of an asynchronous operation.
 */
export interface MessagesState extends AsyncStateBase {
  ready: boolean
  messages: Message[]
  defaultMessages: string[]
}

/**
 * Defines the structure of the 'notifications' state.
 * This state contains information about the notifications sent to the user.
 */
export interface NotificationsState {
  history: Notification[]
}