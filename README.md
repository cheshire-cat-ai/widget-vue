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
    <cheshire-cat-chat />
</div>
```

## Attributes

The available attributes are:

| Attribute   | Required | Type     | Default value | Description                                 |
|:-----------:|:--------:|:--------:|:-------------:|:-------------------------------------------:|
| url         | true     | String   |               | The URL to use to communicate with the CCat. |
| auth        | true     | String   |               | The authentication key to use for the CCat's endpoints.                    |
| port        | false    | String   |               | The port to use in combination with the `url` to communicate with the CCat. |
| dark        | false    | Boolean  | `false`       | `true` if the chat have to use the dark mode. `false` if not. |
| primary     | false    | String   | `#F3977B`   | The color to use to stylize the chat. |
| secure      | false    | Boolean  | `false`       | `true` if the widget should use the secure protocol (https/wss). `false` if not. |
| timeout     | false    | Number   | `10000`       | The amount of time (in milliseconds) to wait before requests generate an error. |
| why         | false    | Boolean  | `false`        | `true` if the chat have to show the WHY button in the CCat response. `false` if not. |
| thinking    | false    | String   | `Cheshire Cat is thinking...` | The text to visualize while the CCat answer is loading. |
| placeholder | false    | String   | `Ask the Cheshire Cat...` | The text to visualize in the input placeholder. |
| wsPath      | false    | String   | `ws`          | The path to use when connecting to the WebSocket. |
| wsDelay     | false    | Number   | `2500`        | The delay (in milliseconds) to wait before trying again to connect to the WebSocket. |
| wsRetries   | false    | Number   | `3`           | The amount of retries (in milliseconds) to do when trying to reconnect to the WebSocket. |
| callback    | false    | String   | `''`          | The name of the function (declared globally) to call before passing the message to the cat. |
| files       | false    | String[] | `["text/plain", "text/markdown", "application/pdf"]` | The accepted content types when uploading a file (must be supported by the cat). |
| defaults    | false    | String[] | `Check stores/useMessages.ts line 14` | The default messages to show before starting the conversation with the cat. |
| features    | false    | String[] | `['record', 'web', 'file', 'reset', 'memory']` | The features that the user can use. |

An example could be:

```html
<div class="w-96 h-96 m-auto">
    <cheshire-cat-chat id="cat-chat" auth="meow" url="localhost" port="1865" callback="myCallback" dark />
</div>
<script>
    const catChat = document.querySelector("#cat-chat")
    
    catChat.defaults = ['Ehy, ciao!', 'Come va?', 'Chi sei?', 'Mostrami cosa sai fare', 'Dammi il cinque!']
    catChat.features = ['web', 'reset']
    catChat.files = ['text/plain', 'application/pdf']

    function myCallback(message) {
        console.log("Callback called.")
        return `Talk in italian. ${message}`
    }
</script>
```

## Events

You also have access to some events:

```html
<div class="w-96 h-96 m-auto">
    <cheshire-cat-chat id="cat-chat" auth="meow" url="localhost" port="1865" />
</div>
<script>
const catChat = document.querySelector("#cat-chat")

catChat.addEventListener("message", ({ detail }) => {
    console.log("Message:", detail.text)
})

catChat.addEventListener("upload", ({ detail }) => {
    console.log("Uploaded content:", detail instanceof File ? detail.name : detail)
})

catChat.addEventListener("notification", ({ detail }) => {
    console.log("Notification:", detail.text)
})

catChat.addEventListener("failed", () => {
    console.log("Failed to connect WebSocket after 3 retries.")
})
</script>
```

The available events are:

| Event          | Response          | Description                                            |
|----------------|-------------------|--------------------------------------------------------|
| message        | `Message`         | Return the message every time a new one is dispatched. |
| upload         | `File` / `string` | Return the uploaded content every time a new one is dispatched. It can be either a file object or a url. |
| notification   | `Notification`    | Return the notification every time a new one is dispatched. |
| failed         |                   | Fired when the WebSocket fails to connect after `x` retries. |
