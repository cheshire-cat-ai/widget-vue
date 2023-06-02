import App from '@/ChatWidget.vue'
import '@/main.css'
import wrapper from 'vue3-webcomponent-wrapper'

setActivePinia(createPinia())

const customElement = wrapper(App, createApp, h)
window.customElements.define("cheshire-cat-chat", customElement)