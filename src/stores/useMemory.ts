import { uniqueId } from '@utils/commons'
import MemoryService from '@services/MemoryService'
import type { Notification } from '@models/Notification'
import { useNotifications } from '@stores/useNotifications'

export const useMemory = defineStore('memory', () => {
  const { showNotification } = useNotifications()

  const wipeConversation = async () => {
    const result = await MemoryService.wipeConversation()
    showNotification({
      id: uniqueId(),
      type: result.status as Notification['type'],
      text: result.message
    })
    return result.status != 'error'
  }
  
  return {
    wipeConversation
  }
})