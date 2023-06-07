<script setup lang="ts">
import { useRabbitHole } from '@stores/useRabbitHole'
import { useMessages } from '@stores/useMessages'
import { useMemory } from '@stores/useMemory'
import { useNotifications } from '@stores/useNotifications'
import { AcceptedContentTypes } from '@services/RabbitHole'
import ModalBox from '@components/ModalBox.vue'
import { generateDarkenColorFrom, generateForegroundColorFrom, convertToHsl } from '@utils/colors'
import type { Message } from '@models/Message'
import type { Notification } from '@models/Notification'
import { setConfig, Features } from '@/config'

const props = withDefaults(defineProps<{
	url: string
	api: string
	callback?: string
	dark?: boolean
	primary?: string
	secure?: boolean
	timeout?: number
	defaults?: string[]
	features?: typeof Features[number][]
	files?: typeof AcceptedContentTypes[number][]
}>(), {
	files: () => Object.values(AcceptedContentTypes),
	timeout: 10000,
	secure: false,
	dark: false,
	primary: '',
	defaults: () => [],
	features: () => Object.values(Features),
	callback: ''
})

const protocol = props.secure ? 's' : ''

setConfig({
	apiKey: props.api,
	socketTimeout: props.timeout,
	features: props.features,
	endpoints: {
		chat: `ws${protocol}://${props.url}/ws`,
		rabbitHole: `http${protocol}://${props.url}/rabbithole/`,
		wipeConversation: `http${protocol}://${props.url}/memory/working-memory/conversation-history/`
	}
})

const messagesStore = useMessages()
const { dispatchMessage, selectRandomDefaultMessages } = messagesStore
const { currentState: messagesState } = storeToRefs(messagesStore)

const textArea = ref<HTMLTextAreaElement>(), widgetRoot = ref<HTMLDivElement>(), chatRoot = ref<HTMLDivElement>()
const userMessage = ref(''), insertedURL = ref(''), isScrollable = ref(false)
const modalBox = ref<InstanceType<typeof ModalBox>>()

useTextareaAutosize({
	element: textArea,
	input: userMessage
})

const { isListening, isSupported, toggle: toggleRecording, result: transcript } = useSpeechRecognition()
const { open: openFile, onChange: onFileChange } = useFileDialog()

const filesStore = useRabbitHole()
const { sendFile, sendWebsite } = filesStore
const { currentState: rabbitHoleState } = storeToRefs(filesStore)

const { currentState: notificationsState } = storeToRefs(useNotifications())

const { wipeConversation } = useMemory()

const inputDisabled = computed(() => {
	return messagesState.value.loading || !messagesState.value.ready || Boolean(messagesState.value.error)
})

const randomDefaultMessages = selectRandomDefaultMessages(props.defaults)

const emit = defineEmits<{
	(e: 'message', message: Message): void,
	(e: 'upload', content: File | string): void,
	(e: 'notification', notification: Notification): void
}>()

/**
 * Handles the file upload change by calling the onUpload callback if it exists.
 */
onFileChange(files => {
	if (files == null) return
	sendFile(files[0])
	emit('upload', files[0])
})

/**
 * When the user stops recording, the transcript will be sent to the messages service
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
	modalBox.value?.toggleModal()
}

const clearConversation = async () => {
	const res = await wipeConversation()
	if (res) messagesState.value.messages = []
}

/**
 * Dispatches the user's message to the Messages service.
 */
const sendMessage = (message: string) => {
	if (message === '') return
	userMessage.value = ''
	dispatchMessage(message, props.callback)
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
		<div class="flex h-full w-full flex-auto flex-col justify-center gap-4 self-center pb-14 text-sm">
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
				<MessageBox v-for="msg in messagesState.messages" :key="msg.id" :sender="msg.sender" :text="msg.text"
					:dark="dark" :why="msg.sender === 'bot' ? JSON.stringify(msg.why) : ''" />
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
			<div v-else class="flex grow cursor-pointer flex-col items-center justify-center gap-4 overflow-y-auto">
				<div v-for="(msg, index) in randomDefaultMessages" :key="index"
					class="btn-neutral btn-sm btn rounded-lg font-normal normal-case shadow-xl @md:btn-md"
					@click="sendMessage(msg)">
					{{ msg }}
				</div>
			</div>
			<div class="absolute bottom-0 left-0 flex w-full items-center justify-center bg-gradient-to-t from-base-100">
				<div class="flex w-full items-center gap-2 @lg:gap-4">
					<div class="relative w-full">
						<textarea ref="textArea" v-model="userMessage" :disabled="inputDisabled"
							class="textarea-bordered textarea block max-h-20 w-full resize-none overflow-hidden border-2 !outline-none !ring-0 transition focus:border-2 focus:border-primary"
							:placeholder="generatePlaceholder(messagesState.loading, isListening, messagesState.error)"
							:class="[features.includes('web') || features.includes('file') ? 'pr-20' : 'pr-10']"
							@keydown="preventSend" />
						<div class="absolute inset-y-0 right-0 flex gap-1 pr-2">
							<button :disabled="inputDisabled || userMessage.length === 0"
								class="btn-ghost btn-sm btn-circle btn self-center"
								@click="sendMessage(userMessage)">
								<heroicons-paper-airplane-solid class="h-6 w-6" />
							</button>
							<div class="dropdown-top dropdown-end dropdown self-center">
								<button tabindex="0" :disabled="inputDisabled" class="btn-ghost btn-sm btn-circle btn">
									<heroicons-paper-clip-20-solid class="h-6 w-6" />
								</button>
								<ul tabindex="0" class="dropdown-content join-vertical join !-right-1/4 mb-4 p-0">
									<li>
										<button :disabled="rabbitHoleState.loading" 
											class="join-item btn w-full flex-nowrap justify-end px-2" 
											@click="modalBox?.toggleModal()">
											<span class="normal-case">Upload url</span>
											<span class="rounded-lg bg-info p-1 text-base-100">
												<heroicons-globe-alt class="h-6 w-6" />
											</span>
										</button>
									</li>
									<li>
										<button :disabled="rabbitHoleState.loading" 
											class="join-item btn w-full flex-nowrap justify-end px-2" 
											@click="openFile({ multiple: false, accept: files.join(', ') })">
											<span class="normal-case">Upload file</span>
											<span class="rounded-lg bg-warning p-1 text-base-100">
												<heroicons-document-text-solid class="h-6 w-6" />
											</span>
										</button>
									</li>
									<li>
										<button :disabled="messagesState.messages.length === 0" 
											class="join-item btn w-full flex-nowrap justify-end px-2" 
											@click="clearConversation()">
											<span class="normal-case">Clear conversation</span>
											<span class="rounded-lg bg-error p-1 text-base-100">
												<heroicons-trash-solid class="h-6 w-6" />
											</span>
										</button>
									</li>
								</ul>
							</div>
						</div>
					</div>
					<button v-if="isSupported && features.includes('record')" class="btn-primary btn-circle btn"
						:class="[isListening ? 'btn-outline glass' : '']" :disabled="inputDisabled"
						@click="toggleRecording()">
						<heroicons-microphone-solid class="h-6 w-6" />
					</button>
				</div>
			</div>
			<button v-if="isScrollable"
				class="btn-primary btn-outline btn-sm btn-circle btn absolute bottom-20 right-4 bg-base-100"
				@click="scrollToBottom">
				<heroicons-arrow-down-20-solid class="h-5 w-5" />
			</button>
		</div>
		<ModalBox ref="modalBox">
			<div class="flex flex-col items-center justify-center gap-2 text-neutral">
				<h3 class="text-lg font-bold">
					Insert URL
				</h3>
				<p>Write down the URL you want the Cat to digest :</p>
				<input v-model="insertedURL" type="text" placeholder="Enter url..."
					class="input-bordered input-primary input input-sm my-4 w-full">
				<button class="btn-primary btn-sm btn" @click="dispatchWebsite">
					Send
				</button>
			</div>
		</ModalBox>
	</div>
</template>
