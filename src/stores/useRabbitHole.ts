import type { FileUploaderState } from '@stores/types'
import { getErrorMessage } from '@utils/errors'
import { apiClient, tryRequest } from '@/config'
import { useNotifications } from '@stores/useNotifications'

export const useRabbitHole = defineStore('rabbitHole', () => {
  const currentState = reactive<FileUploaderState>({
    loading: false
  })

  const { showNotification } = useNotifications()

  const sendFile = (file: File) => {
    currentState.loading = true
    tryRequest(
      apiClient.api.rabbitHole.uploadFile({ file }), 
      `File ${file.name} successfully sent down the rabbit hole`, 
      "Unable to send the file to the rabbit hole"
    ).then(({ data }) => {
      currentState.loading = false
      currentState.data = data
      showNotification({
        text: `File ${file.name} successfully sent down the rabbit hole!`,
        type: 'success'
      })
    }).catch(error => {
      currentState.error = getErrorMessage(error)
    })
  }

  const sendMemory = (file: File) => {
    currentState.loading = true
    tryRequest(
      apiClient.api.rabbitHole.uploadMemory({ file }), 
      "Memories file successfully sent down the rabbit hole", 
      "Unable to send the memories to the rabbit hole"
    ).then(({ data }) => {
      currentState.loading = false
      currentState.data = data
      showNotification({
        text: `Memories successfully sent down the rabbit hole!`,
        type: 'success'
      })
    }).catch(error => {
      currentState.error = getErrorMessage(error)
    })
  }

  const sendWebsite = (url: string) => {
    currentState.loading = true
    tryRequest(
      apiClient.api.rabbitHole.uploadUrl({ url }), 
      "Website successfully sent down the rabbit hole", 
      "Unable to send the website to the rabbit hole"
    ).then(({ data }) => {
      currentState.loading = false
      currentState.data = data
      showNotification({
        text: `Website successfully sent down the rabbit hole!`,
        type: 'success'
      })
    }).catch(error => {
      currentState.error = getErrorMessage(error)
    })
  }

  return {
    currentState,
    sendFile,
    sendWebsite,
    sendMemory
  }
})