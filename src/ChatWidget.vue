<script setup lang="ts">
import { useRabbitHole } from '@stores/useRabbitHole'
import { useMessages } from '@stores/useMessages'
import { useMemory } from '@stores/useMemory'
import { AcceptedFileTypes, type AcceptedFileType, AcceptedMemoryTypes } from 'ccat-api'
import { useNotifications } from '@stores/useNotifications'
import ModalBox from '@components/ModalBox.vue'
import { convertToHsl, generateDarkenColorFrom, generateForegroundColorFrom } from '@utils/colors'
import type { Message } from '@models/Message'
import type { Notification } from '@models/Notification'
import { Features, updateClient } from '@/config'
import CatClient from 'ccat-api'

const props = withDefaults(defineProps<{
	url: string
	auth: string
	callback?: string
	dark?: boolean
	port?: string
	wsPath?: string
	wsRetries?: number
	wsDelay?: number
	primary?: string
	secure?: boolean
	showWhy?: boolean
	timeout?: number
	defaults?: string[]
	promptSettings?: string
	features?: typeof Features[number][]
	files?: AcceptedFileType[]
}>(), {
	files: () => Object.values(AcceptedFileTypes),
	timeout: 10000,
	secure: false,
	dark: false,
	port: '',
	showWhy: true,
	wsDelay: 2500,
	wsPath: 'ws',
	wsRetries: 3,
	primary: '',
	callback: '',
	promptSettings: '{}',
	defaults: () => [],
	features: () => Object.values(Features),
})

if (props.dark) import("highlight.js/scss/github.scss")
else import("highlight.js/scss/github-dark.scss")

const emit = defineEmits<{
	(e: 'message', message: Message): void,
	(e: 'upload', content: File | string): void,
	(e: 'notification', notification: Notification): void,
	(e: 'failed'): void
}>()

updateClient(new CatClient({
    baseUrl: props.url,
    authKey: props.auth,
    port: props.port,
    secure: props.secure,
    timeout: props.timeout,
    ws: {
        path: props.wsPath,
        retries: props.wsRetries,
        delay: props.wsDelay,
        onFailed: () => emit('failed')
    }
}))

const hasMenu = props.features.filter(v => v != 'record').length > 0

const messagesStore = useMessages()
const { dispatchMessage, selectRandomDefaultMessages } = messagesStore
const { currentState: messagesState } = storeToRefs(messagesStore)

const userMessage = ref(''), insertedURL = ref(''), isScrollable = ref(false), isTwoLines = ref(false)
const boxUploadURL = ref<InstanceType<typeof ModalBox>>()
const widgetRoot = ref<HTMLDivElement>(), chatRoot = ref<HTMLDivElement>()

const { textarea: textArea } = useTextareaAutosize({
	input: userMessage,
	onResize: () => {
		if (textArea.value) {
			isTwoLines.value = textArea.value.clientHeight >= 72
		}
	}
})

const { isListening, isSupported, toggle: toggleRecording, result: transcript } = useSpeechRecognition()
const { open: openFile, onChange: onFileUpload } = useFileDialog()
const { open: openMemory, onChange: onMemoryUpload } = useFileDialog()

const filesStore = useRabbitHole()
const { sendFile, sendWebsite, sendMemory } = filesStore
const { currentState: rabbitHoleState } = storeToRefs(filesStore)

const { currentState: notificationsState } = storeToRefs(useNotifications())

const { wipeConversation } = useMemory()

const inputDisabled = computed(() => {
	return messagesState.value.loading || !messagesState.value.ready || Boolean(messagesState.value.error)
})

const randomDefaultMessages = selectRandomDefaultMessages(props.defaults)

/**
 * Handles the file upload by calling the Rabbit Hole endpoint with the file attached
 * and calls the onUpload callback if it exists.
 */
onFileUpload(files => {
	if (files == null) return
	sendFile(files[0])
	emit('upload', files[0])
})

/**
 * Handles the memory upload by calling the Rabbit Hole endpoint with the file attached
 * and calls the onUpload callback if it exists.
 */
onMemoryUpload(files => {
	if (files == null) return
	sendMemory(files[0])
	emit('upload', files[0])
})

/**
 * When the user stops recording, the transcript will be sent to the messages service.
 */
watchEffect(() => {
	if (transcript.value === '') return
	userMessage.value = transcript.value
})

/**
 * When a new notification arrives, it will be sent through the emitted event.
 */
watchDeep(notificationsState, () => {
	const lastNotification = notificationsState.value.history.slice(-1)[0]
	if (!lastNotification.hidden) {
		emit('notification', lastNotification)
	}
})

/**
 * When a new message arrives, the chat will be scrolled to bottom and the input box will be focussed.
 * If audio is enabled, a pop sound will be played.
 */
watchDeep(messagesState, () => {
	if (messagesState.value.messages.length > 0) {
		emit('message', messagesState.value.messages.slice(-1)[0])
	}
	if (chatRoot.value) {
		isScrollable.value = chatRoot.value?.scrollHeight > chatRoot.value?.clientHeight
	}
	scrollToBottom()
	textArea.value?.focus()
}, { flush: 'post' })

/**
 * When switching to the widget, the input box is focussed.
 */
onMounted(() => {
	if (props.primary && widgetRoot.value) {
		widgetRoot.value.style.setProperty('--p', convertToHsl(props.primary)) // normal
		widgetRoot.value.style.setProperty('--pf', generateDarkenColorFrom(props.primary)) // focus
		widgetRoot.value.style.setProperty('--pc', generateForegroundColorFrom(props.primary)) // content
	}
	textArea.value?.focus()
})

/**
 * Dispatches the inserted url to the RabbitHole service and closes the modal.
 */
const dispatchWebsite = () => {
	if (!insertedURL.value) return
	sendWebsite(insertedURL.value)
	emit('upload', insertedURL.value)
	boxUploadURL.value?.toggleModal()
}

/**
 * Dispatches the user's message to the Messages service.
 */
const sendMessage = (message: string) => {
	if (message === '') return
	userMessage.value = ''
	dispatchMessage(message, props.callback, JSON.parse(props.promptSettings))
}

/**
 * Prevent sending the message if the shift key is pressed.
 */
const preventSend = (e: KeyboardEvent) => {
	if (e.key === 'Enter' && !e.shiftKey) {
		e.preventDefault()
		sendMessage(userMessage.value)
	}
}

const generatePlaceholder = (isLoading: boolean, isRecording: boolean, error?: string) => {
	if (error) return 'Well, well, well, looks like something has gone amiss'
	if (isLoading) return 'The enigmatic Cheshire cat is pondering...'
	if (isRecording) return 'The curious Cheshire cat is all ears...'
	return 'Ask the Cheshire Cat...'
}

const scrollToBottom = () => chatRoot.value?.scrollTo({ behavior: 'smooth', left: 0, top: chatRoot.value?.scrollHeight })
</script>

<template>
	<div ref="widgetRoot" :data-theme="dark ? 'dark' : 'light'"
		class="relative flex h-full min-h-full w-full flex-col scroll-smooth transition-colors @container selection:bg-primary">
		<NotificationStack />
		<div class="flex h-full w-full flex-auto flex-col justify-center gap-4 self-center text-sm"
			:class="{
				'pb-12 @md:pb-16': !isTwoLines,
				'pb-16 @md:pb-20': isTwoLines,
			}">
			<div v-if="!messagesState.ready" class="flex grow items-center justify-center self-center">
				<p v-if="messagesState.error" class="w-fit rounded-md bg-error p-4 font-semibold text-base-100">
					{{ messagesState.error }}
				</p>
				<p v-else class="flex flex-col items-center justify-center gap-2">
					<span class="loading loading-spinner loading-lg text-primary" />
					<span class="text-lg font-medium text-neutral">Getting ready...</span>
				</p>
			</div>
			<div v-else-if="messagesState.messages.length" id="w-root" ref="chatRoot"
				class="flex grow flex-col overflow-y-auto">
				<MessageBox v-for="msg in messagesState.messages"
					:key="msg.id"
					:sender="msg.sender"
					:text="msg.text"
					:why="showWhy ? (msg.sender === 'bot' ? msg.why : '') : ''" />
				<p v-if="messagesState.error" class="w-fit rounded-md bg-error p-4 font-semibold text-base-100">
					{{ messagesState.error }}
				</p>
				<div v-else-if="!messagesState.error && messagesState.loading" class="mb-2 ml-2 flex items-center gap-2">
					<span class="text-lg">😺</span>
					<p class="flex items-center gap-2">
						<span class="loading loading-dots loading-xs" />
						Cheshire cat is thinking...
					</p>
				</div>
			</div>
			<div v-else class="flex grow cursor-pointer flex-col items-center justify-center gap-4 overflow-y-auto p-4">
				<div v-for="(msg, index) in randomDefaultMessages" :key="index" class="btn-neutral btn font-medium normal-case text-base-100 shadow-lg"
					@click="sendMessage(msg)">
					{{ msg }}
				</div>
			</div>
			<div class="fixed bottom-0 left-0 flex w-full items-center justify-center bg-gradient-to-t from-base-100">
				<div class="flex w-full items-center gap-2 @lg:gap-4">
					<div class="relative w-full">
						<textarea ref="textArea" v-model="userMessage" :disabled="inputDisabled"
							class="textarea block max-h-20 w-full resize-none !outline-offset-0" 
							:class="[ hasMenu ? (isTwoLines ? 'pr-10' : 'pr-20') : 'pr-10' ]"
							:placeholder="generatePlaceholder(messagesState.loading, isListening, messagesState.error)" @keydown="preventSend" />
						<div :class="[ isTwoLines ? 'flex-col-reverse' : '' ]" class="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
							<button :disabled="inputDisabled || userMessage.length === 0"
								class="btn-ghost btn-sm btn-circle btn self-center"
								@click="sendMessage(userMessage)">
								<heroicons-paper-airplane-solid class="h-6 w-6" />
							</button>
							<div v-if="hasMenu" class="dropdown-top dropdown-end dropdown self-center">
								<button tabindex="0" :disabled="inputDisabled" class="btn-ghost btn-sm btn-circle btn">
									<heroicons-bolt-solid class="h-6 w-6" />
								</button>
								<ul tabindex="0" class="dropdown-content join-vertical join !-right-1/4 z-10 mb-5 p-0">
									<li v-if="features.includes('memory')">
										<!-- :disabled="rabbitHoleState.loading" -->
										<button disabled
											class="join-item btn w-full flex-nowrap px-2" 
											@click="openMemory({ multiple: false, accept: AcceptedMemoryTypes.join(',') })">
											<span class="grow normal-case">Upload memories</span>
											<span class="rounded-lg bg-success p-1 text-base-100">
												<ph-brain-fill class="h-6 w-6" />
											</span>
										</button>
									</li>
									<li v-if="features.includes('web')">
										<button :disabled="rabbitHoleState.loading" 
											class="join-item btn w-full flex-nowrap px-2" 
											@click="boxUploadURL?.toggleModal()">
											<span class="grow normal-case">Upload url</span>
											<span class="rounded-lg bg-info p-1 text-base-100">
												<heroicons-globe-alt class="h-6 w-6" />
											</span>
										</button>
									</li>
									<li v-if="features.includes('file')">
										<button :disabled="rabbitHoleState.loading" 
											class="join-item btn w-full flex-nowrap px-2" 
											@click="openFile({ multiple: false, accept: AcceptedFileTypes.join(',') })">
											<span class="grow normal-case">Upload file</span>
											<span class="rounded-lg bg-warning p-1 text-base-100">
												<heroicons-document-text-solid class="h-6 w-6" />
											</span>
										</button>
									</li>
									<li v-if="features.includes('reset')">
										<button :disabled="messagesState.messages.length === 0" 
											class="join-item btn w-full flex-nowrap px-2" 
											@click="wipeConversation()">
											<span class="grow normal-case">Clear conversation</span>
											<span class="rounded-lg bg-error p-1 text-base-100">
												<heroicons-trash-solid class="h-6 w-6" />
											</span>
										</button>
									</li>
								</ul>
							</div>
						</div>
					</div>
					<button v-if="isSupported && features.includes('record')" 
						class="btn-primary btn-circle btn" :class="[isListening ? 'btn-outline glass' : '']"
						:disabled="inputDisabled" @click="toggleRecording()">
						<heroicons-microphone-solid class="h-6 w-6" />
					</button>
				</div>	
				<button v-if="isScrollable" class="btn-primary btn-outline btn-sm btn-circle btn absolute bottom-24 right-4 bg-base-100"
					@click="scrollToBottom">
					<heroicons-arrow-down-20-solid class="h-5 w-5" />
				</button>
			</div>
			<ModalBox ref="boxUploadURL">
				<div class="flex flex-col items-center justify-center gap-4 text-neutral">
					<h3 class="text-lg font-bold">
						Insert URL
					</h3>
					<p>Write down the URL you want the Cat to digest :</p>
					<input v-model="insertedURL" type="text" placeholder="Enter url..."
						class="input-bordered input-primary input input-sm w-full">
					<button class="btn-primary btn-sm btn" @click="dispatchWebsite">
						Send
					</button>
				</div>
			</ModalBox>
		</div>
	</div>
</template>
