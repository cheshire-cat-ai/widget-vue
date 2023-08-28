<script setup lang="ts">
import { useRabbitHole } from '@stores/useRabbitHole'
import { useMessages } from '@stores/useMessages'
import { useMemory } from '@stores/useMemory'
import { AcceptedMemoryTypes } from 'ccat-api'
import { useNotifications } from '@stores/useNotifications'
import ModalBox from '@components/ModalBox.vue'
import { convertToHsl, generateDarkenColorFrom, generateForegroundColorFrom } from '@utils/colors'
import type { Message } from '@models/Message'
import type { Notification } from '@models/Notification'
import { Features, type Feature, updateClient } from '@/config'
import { CatClient, type PromptSettings, type CatSettings } from 'ccat-api'

interface WidgetSettings {
	settings: CatSettings & {
		dark?: boolean
		why?: boolean
		thinking?: string
		user?: string
		placeholder?: string
		primary?: string
		callback?: (message: string) => Promise<string>
		prompt?: Partial<PromptSettings>
		defaults?: string[]
		features?: Feature[]
	}
}

const props = withDefaults(defineProps<WidgetSettings>(), {
	settings: () => ({
		baseUrl: 'localhost',
		dark: false,
		why: false,
		user: "user",
		thinking: 'Cheshire Cat is thinking...',
		placeholder: 'Ask the Cheshire Cat...',
		primary: '',
		defaults: [],
		features: Object.values(Features)
	})
})

const { settings } = toReactive(props)

if (settings.dark) import("highlight.js/styles/github.css")
else import("highlight.js/styles/github-dark.css")

const emit = defineEmits<{
	(e: 'message', message: Message): void,
	(e: 'upload', content: File | string): void,
	(e: 'notification', notification: Notification): void
}>()

updateClient(new CatClient(settings))

const hasMenu = (settings.features ?? []).filter(v => v != 'record').length > 0

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

const randomDefaultMessages = selectRandomDefaultMessages(settings.defaults)

const dropContentZone = ref<HTMLDivElement>()

/**
 * Calls the specific endpoints based on the mime type of the file
 */
const contentHandler = (content: string | File[] | null) => {
	if (!content) return
	if (typeof content === 'string') {
		if (content.trim().length == 0) return
		try { 
			new URL(content)
			sendWebsite(content)
		} catch (_) { 
			dispatchMessage(content, settings.user ?? "user", settings.callback, settings.prompt ?? {})
		}
	} else content.forEach(f => sendFile(f))
}

/**
 * Handles the drag & drop feature
 */
const { isOverDropZone } = useDropZone(dropContentZone, {
	onLeave: () => {
		isOverDropZone.value = false
	},
	onDrop: (files, evt) => {
		const text = evt.dataTransfer?.getData("text")
		contentHandler(text || files)
	}
})

/**
 * Handles the copy-paste feature
 */
useEventListener<ClipboardEvent>(dropContentZone, 'paste', evt => {
	if ((evt.target as HTMLElement).isEqualNode(textArea.value)) return
	const text = evt.clipboardData?.getData('text')
	const files = evt.clipboardData?.getData('file') || Array.from(evt.clipboardData?.files ?? [])
	contentHandler(text || files)
})

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
	if (settings.primary && widgetRoot.value) {
		widgetRoot.value.style.setProperty('--p', convertToHsl(settings.primary)) // normal
		widgetRoot.value.style.setProperty('--pf', generateDarkenColorFrom(settings.primary)) // focus
		widgetRoot.value.style.setProperty('--pc', generateForegroundColorFrom(settings.primary)) // content
	}
	textArea.value?.focus()
})

/**
 * Dispatches the inserted url to the RabbitHole service and closes the modal.
 */
const dispatchWebsite = () => {
	if (!insertedURL.value) return
	try { 
		new URL(insertedURL.value)
		sendWebsite(insertedURL.value)
		emit('upload', insertedURL.value)
		boxUploadURL.value?.toggleModal()
	} catch (_) {
		insertedURL.value = ''
	}
}

/**
 * Dispatches the user's message to the Messages service.
 */
const sendMessage = (message: string) => {
	if (message === '') return
	userMessage.value = ''
	dispatchMessage(message, settings.user ?? "user", settings.callback, settings.prompt ?? {})
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

const scrollToBottom = () => chatRoot.value?.scrollTo({ behavior: 'smooth', left: 0, top: chatRoot.value?.scrollHeight })
</script>

<template>
	<div ref="widgetRoot" :data-theme="settings.dark ? 'dark' : 'light'"
		class="relative flex h-full min-h-full w-full flex-col scroll-smooth transition-colors @container selection:bg-primary">
		<NotificationStack />
		<div ref="dropContentZone"
			class="relative flex h-full w-full flex-col justify-center gap-4 self-center text-sm"
			:class="{
				'pb-16 md:pb-20': !isTwoLines,
				'pb-20 md:pb-24': isTwoLines,
			}">
			<div v-if="isOverDropZone" class="flex h-full w-full grow flex-col items-center justify-center py-4 md:pb-0">
				<div class="relative flex w-full grow items-center justify-center rounded-md border-2 border-dashed border-primary p-2 md:p-4">
					<p class="text-lg md:text-xl">
						Drop 
						<span class="font-medium text-primary">
							files
						</span>
						to send to the Cheshire Cat, meow!
					</p>
					<button class="btn btn-circle btn-error btn-sm absolute right-2 top-2" @click="isOverDropZone = false">
						<heroicons-x-mark-20-solid class="h-6 w-6" />
					</button>
				</div>
			</div>
			<div v-else-if="!messagesState.ready" class="flex grow items-center justify-center self-center">
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
					:why="settings.why && msg.sender === 'bot' ? msg.why : ''" />
				<p v-if="messagesState.error" class="w-fit rounded-md bg-error p-4 font-semibold text-base-100">
					{{ messagesState.error }}
				</p>
				<div v-else-if="!messagesState.error && messagesState.loading" class="mb-2 ml-2 flex items-center gap-2">
					<span class="text-lg">😺</span>
					<p class="flex items-center gap-2">
						<span class="loading loading-dots loading-xs" />
						{{ settings.thinking }}
					</p>
				</div>
			</div>
			<div v-else class="flex grow cursor-pointer flex-col items-center justify-center gap-4 overflow-y-auto p-4">
				<div v-for="(msg, index) in randomDefaultMessages" :key="index" class="btn btn-neutral font-medium normal-case text-base-100 shadow-lg"
					@click="sendMessage(msg)">
					{{ msg }}
				</div>
			</div>
			<div class="fixed bottom-0 left-0 flex w-full items-center justify-center">
				<div class="flex w-full items-center gap-2 @md:gap-4">
					<div class="relative w-full">
						<textarea ref="textArea" v-model.trim="userMessage" :disabled="inputDisabled"
							class="textarea block max-h-20 w-full resize-none overflow-auto bg-base-200 !outline-offset-0" 
							:class="[ hasMenu ? (isTwoLines ? 'pr-10' : 'pr-20') : 'pr-10' ]"
							:placeholder="settings.placeholder" @keydown="preventSend" />
						<div :class="[ isTwoLines ? 'flex-col-reverse' : '' ]" class="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
							<button :disabled="inputDisabled || userMessage.length === 0"
								class="btn btn-circle btn-ghost btn-sm self-center"
								@click="sendMessage(userMessage)">
								<heroicons-paper-airplane-solid class="h-6 w-6" />
							</button>
							<div v-if="hasMenu" class="dropdown dropdown-end dropdown-top self-center">
								<button tabindex="0" :disabled="inputDisabled" class="btn btn-circle btn-ghost btn-sm">
									<heroicons-bolt-solid class="h-6 w-6" />
								</button>
								<ul tabindex="0" class="dropdown-content join join-vertical !-right-1/4 z-10 mb-5 p-0">
									<li v-if="settings.features?.includes('memory')">
										<button :disabled="rabbitHoleState.loading"
											class="btn join-item w-full flex-nowrap px-2" 
											@click="openMemory({ multiple: false, accept: AcceptedMemoryTypes.join(',') })">
											<span class="grow normal-case">Upload memories</span>
											<span class="rounded-lg bg-success p-1 text-base-100">
												<ph-brain-fill class="h-6 w-6" />
											</span>
										</button>
									</li>
									<li v-if="settings.features?.includes('web')">
										<button :disabled="rabbitHoleState.loading" 
											class="btn join-item w-full flex-nowrap px-2" 
											@click="boxUploadURL?.toggleModal()">
											<span class="grow normal-case">Upload url</span>
											<span class="rounded-lg bg-info p-1 text-base-100">
												<heroicons-globe-alt class="h-6 w-6" />
											</span>
										</button>
									</li>
									<li v-if="settings.features?.includes('file')">
										<button :disabled="rabbitHoleState.loading" 
											class="btn join-item w-full flex-nowrap px-2" 
											@click="openFile({ multiple: false })">
											<span class="grow normal-case">Upload file</span>
											<span class="rounded-lg bg-warning p-1 text-base-100">
												<heroicons-document-text-solid class="h-6 w-6" />
											</span>
										</button>
									</li>
									<li v-if="settings.features?.includes('reset')">
										<button :disabled="messagesState.messages.length === 0" 
											class="btn join-item w-full flex-nowrap px-2" 
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
					<button v-if="isSupported && settings.features?.includes('record')" 
						class="btn btn-circle btn-primary" :class="[isListening ? 'glass btn-outline' : '']"
						:disabled="inputDisabled" @click="toggleRecording()">
						<heroicons-microphone-solid class="h-6 w-6" />
					</button>
				</div>
				<button v-if="isScrollable" class="btn btn-circle btn-primary btn-outline btn-sm absolute bottom-28 right-4 bg-base-100"
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
					<input v-model.trim="insertedURL" type="text" placeholder="Enter url..."
						class="input input-primary input-sm w-full !transition-all">
					<button class="btn btn-primary btn-sm" @click="dispatchWebsite">
						Send
					</button>
				</div>
			</ModalBox>
		</div>
	</div>
</template>
