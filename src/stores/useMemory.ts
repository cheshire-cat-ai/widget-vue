import { useNotifications } from '@stores/useNotifications'
import { useMessages } from '@stores/useMessages'
import { apiClient, tryRequest } from '@/config'

export const useMemory = defineStore('memory', () => {
  const { sendNotificationFromJSON } = useNotifications()
  const { currentState: messagesState } = storeToRefs(useMessages())

  const wipeConversation = async () => {
    const result = await tryRequest(
      apiClient.api?.memory.wipeConversationHistory(), 
      "The current conversation was wiped", 
      "Unable to wipe the in-memory current conversation"
    )
    if (result.status == 'success') messagesState.value.messages = []
    return sendNotificationFromJSON(result)
  }
  
  return {
    wipeConversation,
  }
})