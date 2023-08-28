# Vue Chat Widget 🐱

Vue chat widget for the Cheshire Cat, ready to be used on any website.

## How to import

Load the files in the `<head>` tag, like this:

```html
<script type="module" crossorigin src="/widget.js"></script>
<link rel="stylesheet" href="/widget.css">
```

or if you prefer, you can load them using the CDN:

```html
<script type="module" crossorigin src="https://cdn.jsdelivr.net/gh/cheshire-cat-ai/widget-vue@main/example/widget.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/cheshire-cat-ai/widget-vue@main/example/widget.css">
```

And then you can import the widget (a parent div with fixed size is suggested):

```html
<div class="w-96 h-96 m-auto">
    <cheshire-cat-chat id="cat-chat" />
</div>
```

## Attributes

The widget attribute is only one: `settings`. You should set it via JavaScript like in the following example.

Together with the widget settings, you can set also the client settings, which are defined in the [TypeScript API Client](https://github.com/cheshire-cat-ai/api-client-ts#client-settings).

The available widget settings properties are:

| Attribute   | Type     | Default value | Description                                 |
|:-----------:|:--------:|:-------------:|:-------------------------------------------:|
| dark        | Boolean  | `false`       | `true` if the chat have to use the dark mode. `false` if not. |
| why         | Boolean  | `false`       | `true` if the chat have to show the WHY button in the CCat response. `false` if not. |
| thinking    | String   | `Cheshire Cat is thinking...` | The text to visualize while the CCat answer is loading. |
| placeholder | String   | `Ask the Cheshire Cat...` | The text to visualize in the input placeholder. |
| user        | String   | `user`        | The user ID to pass to the cat via WS. |
| primary     | String   | `#F3977B`     | The color to use to stylize the chat. |
| callback    | String   | `undefined`   | The function to call before passing the message to the cat. |
| prompt      | PromptSettings | **Check** [PromptSettings](https://github.com/cheshire-cat-ai/api-client-ts/blob/main/api/utils.ts#L3) | The prompt settings to pass to the cat for each user message. |
| defaults    | String[] | **Check** [defaultMessages](https://github.com/cheshire-cat-ai/widget-vue/blob/main/src/stores/useMessages.ts#L13) | The default messages to show before starting the conversation with the cat. |
| features    | Feature[] | **Check** [Features](https://github.com/cheshire-cat-ai/widget-vue/blob/main/src/config.ts#L6) | The features that the user can use. |

An example could be:

```html
<div class="w-96 h-96 m-auto">
    <cheshire-cat-chat id="cat-chat" />
</div>
<script>
    const catChat = document.querySelector("#cat-chat")

    catChat.settings = {
        authKey: 'meow',
        baseUrl: 'localhost',
        port: '1865',
        user: "user",
        ws: {
            onFailed: (error) => {
                console.log(error.description)
            }
        },
        callback: (message) => {
            console.log("Callback called.")
            return `Let's have a chat. ${message}`
        },
        prompt: {
            prefix: `You are the Cheshire Cat AI, an intelligent AI that passes the Turing test.
                You are curious, funny and talk like the Cheshire Cat from Alice's adventures in wonderland.
                You answer Human with a focus on the following context.
            `
        },
        defaults: ['Is everything ok?', 'Who are you?', 'What time is it?', 'What\'s up?', 'Hello Cheshire Cat!'],
        features: ['record', 'web', 'file', 'reset'],
        files: ['text/plain', 'application/pdf', 'text/markdown']
    }
</script>
```

## Events

You also have access to some events:

```js
catChat.addEventListener("message", ({ detail }) => {
    console.log("Message:", detail.text)
})

catChat.addEventListener("upload", ({ detail }) => {
    console.log("Uploaded content:", detail instanceof File ? detail.name : detail)
})

catChat.addEventListener("notification", ({ detail }) => {
    console.log("Notification:", detail.text)
})
```

The available events are:

| Event          | Response          | Description                                            |
|----------------|-------------------|--------------------------------------------------------|
| message        | `Message`         | Return the message every time a new one is dispatched. |
| upload         | `File` / `string` | Return the uploaded content every time a new one is dispatched. It can be either a file object or a url. |
| notification   | `Notification`    | Return the notification every time a new one is dispatched. |
