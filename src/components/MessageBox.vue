<script setup lang="ts">
import hljs from 'highlight.js'
import { Remarkable } from 'remarkable'
import { linkify } from 'remarkable/linkify'
import 'highlight.js/styles/github.css'
import SidePanel from '@components/SidePanel.vue'
import { JsonTreeView } from 'json-tree-view-vue3'

const whyPanel = ref<InstanceType<typeof SidePanel>>()

const markdown = new Remarkable({
	breaks: true,
	typographer: true,
	highlight: (str, lang) => {
		if (lang && hljs.getLanguage(lang)) {
			try { return hljs.highlight(str, { language: lang }).value }
			catch (_) { console.log(_) }
		}
		try { return hljs.highlightAuto(str).value }
		catch (_) { console.log(_) }
		return '' // use external default escaping
	}
}).use(linkify)
markdown.inline.ruler.enable(['sup', 'sub'])
markdown.core.ruler.enable(['abbr'])
markdown.block.ruler.enable(['footnote', 'deflist'])
markdown.core.ruler.disable([ 'smartquotes' ])

const props = defineProps<{
	sender: 'bot' | 'user',
	text: string,
	why: string,
	dark: boolean
}>()

const cleanedText = props.text.replace(/""?(.+)"?"/gm, '$1')
</script>

<template>
	<div class="chat gap-x-2" :class="[sender === 'bot' ? 'chat-start' : 'chat-end']">
		<div class="chat-image px-2 text-lg">
			{{ sender === 'bot' ? '😺' : '🙂' }}
		</div>
		<div class="chat-bubble my-2 min-h-fit break-words rounded-lg p-2.5 @lg:p-4" :class="{ '!pr-10': why }">
			<p v-html="markdown.render(cleanedText)" />
			<button v-if="why" class="btn-primary btn-square btn-xs btn absolute right-1 top-1 m-1 !p-0"
				@click="whyPanel?.togglePanel()">
				<p class="text-base text-neutral">
					?
				</p>
			</button>
		</div>
		<SidePanel ref="whyPanel" title="Why this response">
			<JsonTreeView :data="why" rootKey="why" :colorScheme="dark ? 'dark' : 'light'" />
		</SidePanel>
	</div>
</template>

<style lang="scss">
.json-view-item.root-item .value-key {
	white-space: normal !important;
}

.chat-bubble > p a {
	@apply underline text-info font-medium;
}
</style>