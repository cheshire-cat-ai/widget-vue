const Features = ['record', 'web', 'file', 'reset'] as const

interface Config {
    apiKey: string
    socketTimeout: number
    features: typeof Features[number][]
    endpoints: {
        chat: string
        rabbitHole: string
        wipeConversation: string
    }
}

let chatConfig: Config = {
    apiKey: '',
    socketTimeout: 10000,
    features: [],
    endpoints: {
        chat: '',
        rabbitHole: '',
        wipeConversation: ''
    }
}

const getConfig = () => chatConfig

const setConfig = (config: Config) => chatConfig = config

/**
 * Makes an authenticated request to the endpoints by passing the access_token.
 */
const authFetch = (url: string, options: RequestInit = {}) => {
    const accessToken = chatConfig.apiKey

    if (accessToken) {
        const headers = options.headers as Record<string, string> ?? {}
        headers["access_token"] = accessToken
        options.headers = headers
    }

    return fetch(url, options)
}

export {
    getConfig,
    setConfig,
    authFetch,
    Features
}
