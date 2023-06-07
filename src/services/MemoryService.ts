import { authFetch } from '@/config'

/*
 * This is a service that is used to manage the memory of the Cheshire Cat.
 */
const MemoryService = Object.freeze({
  wipeConversation: async () => {
    try {
      const { error } = await authFetch('/memory/working-memory/conversation-history/').delete()

      if (error) throw new Error()

      return {
        status: 'success',
        message: "The current conversation was wiped"
      }
    } catch (error) {
      return {
        status: 'error',
        message: "Unable to wipe the in-memory current conversation"
      }
    }
  }
})

export default MemoryService
