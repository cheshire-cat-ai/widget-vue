<script setup lang="ts">
import { useRabbitHole } from '@stores/useRabbitHole'
import { useMessages } from '@stores/useMessages'
import { AcceptedContentTypes } from '@services/RabbitHole'
import ModalBox from '@components/ModalBox.vue'
import { generateDarkenColorFrom, generateForegroundColorFrom, convertToHsl } from '@utils/colors'

const props = withDefaults(defineProps<{
	url: string
	api: string
	dark?: boolean
	primary?: string
	secure?: boolean
	timeout?: number
	files?: typeof AcceptedContentTypes[number][]
}>(), {
	files: () => Object.values(AcceptedContentTypes),
	timeout: 10000,
	secure: false,
	primary: '',
	dark: true
})

const messagesStore = useMessages(`ws${props.secure ? 's' : ''}://${props.url}/ws`, props.timeout)()
const { dispatchMessage, selectRandomDefaultMessages } = messagesStore
const { currentState: messagesState } = storeToRefs(messagesStore)

const textArea = ref<HTMLElement>(), widgetRoot = ref<HTMLDivElement>()
const userMessage = ref(''), insertedURL = ref(''), isTwoLines = ref(false), isScrollable = ref(false)
const modalBox = ref<InstanceType<typeof ModalBox>>()

const { isListening, isSupported, toggle: toggleRecording, result: transcript } = useSpeechRecognition()
const { open: openFile, onChange: onFileChange } = useFileDialog()

const filesStore = useRabbitHole(`http${props.secure ? 's' : ''}://${props.url}/rabbithole/`, props.api)()
const { sendFile, sendWebsite } = filesStore
const { currentState: rabbitHoleState } = storeToRefs(filesStore)

const inputDisabled = computed(() => {
	return messagesState.value.loading || !messagesState.value.ready || Boolean(messagesState.value.error)
})

const randomDefaultMessages = selectRandomDefaultMessages()

/**
 * Handles the file upload change by calling the onUpload callback if it exists.
 */
onFileChange(files => {
	if (files == null) return
	sendFile(files[0])
})

/**
 * When the user stops recording, the transcript will be sent to the messages service
 */
watchEffect(() => {
	if (transcript.value === '') return
	userMessage.value = transcript.value
})

/**
 * Checks if the textarea needs to be multiline and updates the state accordingly.
 */
watchEffect(() => {
	if (!textArea.value || !userMessage.value) {
		isTwoLines.value = false
		return
	}
	const letterWidth = 8.275
	const isMultiLine = letterWidth * userMessage.value.length > textArea.value.offsetWidth
	const hasLineBreak = !!(/\r|\n/.exec(userMessage.value))
	isTwoLines.value = (textArea.value && !userMessage.value) || (isMultiLine || hasLineBreak)
})

/**
 * When a new message arrives, the chat will be scrolled to bottom and the input box will be focussed.
 */
watchDeep(messagesState, () => {
	if (widgetRoot.value) {
		isScrollable.value = widgetRoot.value?.scrollHeight > widgetRoot.value?.clientHeight
	}
	scrollToBottom()
	textArea.value?.focus()
}, { flush: 'post' })

/**
 * When switching to the widget, the input box is focussed.
 */
onMounted(() => {
	if (props.primary) {
		document.documentElement.style.setProperty('--p', convertToHsl(props.primary)) // normal
		document.documentElement.style.setProperty('--pf', generateDarkenColorFrom(props.primary)) // focus
		document.documentElement.style.setProperty('--pc', generateForegroundColorFrom(props.primary)) // content
	}
	textArea.value?.focus()
})

/**
 * Dispatches the inserted url to the RabbitHole service and closes the modal.
 */
const dispatchWebsite = () => {
	if (!insertedURL.value) return
	sendWebsite(insertedURL.value)
	modalBox.value?.toggleModal()
}

/**
 * Dispatches the user's message to the Messages service.
 */
const sendMessage = (message: string) => {
	if (message === '') return
	userMessage.value = ''
	dispatchMessage(message)
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

const scrollToBottom = () => widgetRoot.value?.scrollTo({ behavior: 'smooth', left: 0, top: widgetRoot.value?.scrollHeight })
</script>

<template>
	<div class="relative flex h-full min-h-full w-full flex-col scroll-smooth transition-colors @container selection:bg-primary">
		<NotificationStack />
		<div class="flex h-full w-full grow flex-col justify-center gap-4 self-center pb-14 text-sm @lg:pb-20 @lg:text-base">
			<div v-if="!messagesState.ready" class="flex grow items-center justify-center self-center">
				<p v-if="messagesState.error" class="w-fit rounded-md bg-error p-4 font-semibold text-base-100">
					{{ messagesState.error }}
				</p>
				<p v-else class="flex flex-col items-center justify-center gap-2">
					<span class="loading loading-spinner loading-lg text-primary" />
					<span class="text-lg font-medium text-neutral">Getting ready...</span>
				</p>
			</div>
			<div v-else-if="messagesState.messages.length" id="w-root" ref="widgetRoot" class="flex grow flex-col overflow-y-auto">
				<MessageBox v-for="msg in messagesState.messages" :key="msg.id"
					:sender="msg.sender" :text="msg.text" :dark="dark"
					:why="msg.sender === 'bot' ? JSON.stringify(msg.why) : ''" />
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
			<div v-else class="flex grow cursor-pointer flex-col items-center justify-center gap-4">
				<div v-for="(msg, index) in randomDefaultMessages" :key="index" class="btn-neutral btn-sm btn rounded-lg font-normal normal-case shadow-xl @lg:btn-md"
					@click="sendMessage(msg)">
					{{ msg }}
				</div>
			</div>
			<div class="absolute bottom-0 left-0 flex w-full items-center justify-center bg-gradient-to-t from-base-100 p-2 @lg:p-4">
				<div class="flex w-full items-center gap-2 @md:gap-4">
					<div class="relative w-full">
						<textarea ref="textArea" v-model="userMessage" :rows="isTwoLines ? '2' : '1'" :disabled="inputDisabled"
							class="textarea-bordered textarea block w-full resize-none overflow-hidden border-2 !pr-20 !outline-none !ring-0 transition focus:border-2 focus:border-primary"
							:placeholder="generatePlaceholder(messagesState.loading, isListening, messagesState.error)" @keydown="preventSend" />
						<div class="absolute inset-y-0 right-0 flex gap-1 pr-2">
							<button :disabled="inputDisabled"
								class="btn-outline btn-sm btn-circle btn self-center border-none text-neutral hover:!bg-transparent hover:text-neutral disabled:bg-transparent"
								@click="sendMessage(userMessage)">
								<heroicons-paper-airplane-solid v-if="userMessage.length > 0" class="h-6 w-6" />
								<heroicons-paper-airplane v-else class="h-6 w-6" />
							</button>
							<Menu as="div" class="dropdown-top dropdown-end dropdown self-center">
								<MenuButton :disabled="inputDisabled || rabbitHoleState.loading"
									class="btn-primary btn-outline btn-sm btn-circle btn border-none hover:!bg-transparent hover:!text-primary-focus disabled:bg-transparent">
									<heroicons-paper-clip-20-solid class="h-6 w-6" />
								</MenuButton>
								<MenuItems class="dropdown-content !-right-1/4 mb-4 flex flex-col gap-2 rounded-md bg-base-200 p-2 shadow-lg focus:outline-none">
									<MenuItem as="button" class="btn-info btn-sm btn-square btn" @click="modalBox?.toggleModal()">
										<heroicons-globe-alt class="h-6 w-6" />
									</MenuItem>
									<MenuItem as="button" class="btn-warning btn-sm btn-square btn"
										@click="openFile({ multiple: false, accept: files.join(', ') })">
										<heroicons-document-text-solid class="h-6 w-6" />
									</MenuItem>
								</MenuItems>
							</Menu>
						</div>
					</div>
					<button v-if="isSupported" class="btn-primary btn-circle btn" :class="[isListening ? 'btn-outline glass' : '']"
						:disabled="inputDisabled" @click="toggleRecording()">
						<heroicons-microphone-solid class="h-6 w-6" />
					</button>
				</div>
			</div>
			<button v-if="isScrollable" class="btn-primary btn-outline btn-sm btn-circle btn absolute bottom-20 right-4 bg-base-100"
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