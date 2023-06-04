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

| Attribute   | Required | Param Type | Default value | Description                                 |
|-------------|----------|------------|---------------|---------------------------------------------|
| url         | true     | String     |               | The URL to use to communicate with the Cat. |
| api         | true     | String     |               | The API key for the Cat.                    |
| dark        | false    | Boolean    | `false`       | `true` if the chat have to use the dark mode. `false` if not. |
| primary     | false    | String     | `#F3977B`     | The color to use to stylize the chat. |
| secure      | false    | Boolean    | `false`       | `true` if the chat have to use the dark mode. `false` if not. |
| timeout     | false    | Number     | `10000`       | The delay (in milliseconds) to wait before trying again to connect. |
| callback    | false    | String     | `''`          | The name of the function (declared globally) to call before passing the message to the cat. |
| files       | false    | String[]   | `["text/plain", "text/markdown", "application/pdf"]` | The accepted content types when uploading a file (must be supported by the cat). |
| defaults    | false    | String[]   | `Check stores/useMessages.ts line 14` | The default messages to show before starting the conversation with the cat. |

An example could be:

```html
<div class="w-96 h-96 m-auto">
    <cheshire-cat-chat id="cat-chat" api="none" url="localhost:1865" callback="myCallback" dark />
</div>
<script>
    const catChat = document.querySelector("#cat-chat")
    
    catChat.defaults = ['Ehy, ciao!', 'Come va?', 'Chi sei?', 'Mostrami cosa sai fare', 'Dammi il cinque!']
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
    <cheshire-cat-chat id="cat-chat" api="none" timeout="5000" url="localhost:1865" primary="#00ff00" dark />
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
</script>
```

The available events are:

| Event          | Response          | Description                                            |
|----------------|-------------------|--------------------------------------------------------|
| message        | `Message`         | Return the message every time a new one is dispatched. |
| upload         | `File` / `string` | Return the uploaded content every time a new one is dispatched. It can be either a file object or a url. |
| notification   | `Notification`    | Return the notification every time a new one is dispatched. |
