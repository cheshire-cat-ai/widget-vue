import { authFetch, getConfig } from '@/config'

/*
 * This is a service that is used to manage the memory of the Cheshire Cat.
 */
const MemoryService = Object.freeze({
  wipeConversation: async () => {
    try {
      const result = await authFetch(getConfig().endpoints.wipeConversation, { method: 'DELETE' })

      if (result.status !== 200) throw new Error()

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
