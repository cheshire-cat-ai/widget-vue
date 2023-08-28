import type { FileUploaderState } from '@stores/types'
import { apiClient, tryRequest } from '@/config'
import { useNotifications } from '@stores/useNotifications'

export const useRabbitHole = defineStore('rabbitHole', () => {
  const currentState = reactive<FileUploaderState>({
    loading: false
  })

  const { sendNotificationFromJSON } = useNotifications()

  const sendFile = (file: File) => {
    currentState.loading = true
    tryRequest(
      apiClient.api?.rabbitHole.uploadFile({ file }), 
      `File ${file.name} successfully sent down the rabbit hole!`, 
      "Unable to send the file to the rabbit hole"
    ).then(res => {
      currentState.loading = false
      currentState.data = res.data
      sendNotificationFromJSON(res)
    })
  }

  const sendMemory = (file: File) => {
    currentState.loading = true
    tryRequest(
      apiClient.api?.rabbitHole.uploadMemory({ file }), 
      "Memories file successfully sent down the rabbit hole!", 
      "Unable to send the memories to the rabbit hole"
    ).then(res => {
      currentState.loading = false
      currentState.data = res.data
      sendNotificationFromJSON(res)
    })
  }

  const sendWebsite = (url: string) => {
    currentState.loading = true
    tryRequest(
      apiClient.api?.rabbitHole.uploadUrl({ url }), 
      "Website successfully sent down the rabbit hole", 
      "Unable to send the website to the rabbit hole"
    ).then(res => {
      currentState.loading = false
      currentState.data = res.data
      sendNotificationFromJSON(res)
    })
  }

  return {
    currentState,
    sendFile,
    sendWebsite,
    sendMemory
  }
})