import { createFetch } from "@vueuse/core"

const Features = ['record', 'web', 'file', 'reset'] as const

interface Config {
    apiKey: string
    socketTimeout: number
    secure: boolean
    baseUrl: string
    features: typeof Features[number][]
}

let chatConfig: Config = {
    apiKey: '',
    secure: false,
    socketTimeout: 10000,
    baseUrl: '',
    features: [],
}

const getConfig = () => chatConfig

const setConfig = (config: Config) => chatConfig = config

/**
 * Makes an authenticated request to the endpoints by passing the access_token.
 */
const authFetch = createFetch({
    baseUrl: `http${chatConfig.secure ? 's' : ''}://${chatConfig.baseUrl}`,
    options: {
        async beforeFetch({ options }) {
            const accessToken = chatConfig.apiKey

            if (accessToken) {
                const headers = options.headers as Record<string, string> ?? {}
                headers["access_token"] = accessToken
                options.headers = headers
            }

            return { options }
        },
    },
    fetchOptions: {
        mode: 'cors',
    },
})

export {
    getConfig,
    setConfig,
    authFetch,
    Features
}
