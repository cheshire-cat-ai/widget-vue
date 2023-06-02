# Vue Chat Widget 🐱

Vue chat widget for the Cheshire Cat, ready to be used on any website.

# How to import

Load the files in the `<head>` tag, like this:

```html
<script type="module" crossorigin src="/widget.js"></script>
<link rel="stylesheet" href="/widget.css">
```

And then you can import the widget (a parent div with fixed size is suggested):

```html
<div class="w-96 h-96 m-auto">
    <cheshire-cat-chat api="none" timeout="5000" url="localhost:1865" primary="#00ff00" dark />
</div>
```

The available attributes are:

| Props   | Required | Param Type | Default value | Description                                           |
|---------|----------|------------|---------------|-------------------------------------------------------|
| url     | true     | String     |               | The URL to use to communicate with the Cat. |
| api     | true     | String     |               | The API key for the Cat. |
| dark | false | Boolean | `false` | `true` if the chat have to use the dark mode. `false` if not. |
| primary | false | String | `#F3977B` | The color to use to stylize the chat. |
| secure | false | Boolean | `false` | `true` if the chat have to use the dark mode. `false` if not. |
| timeout | false | Number | `10000` | The delay (in milliseconds) to wait before trying again to connect. |
| files | false | ["text/plain", "text/markdown", "application/pdf"] | `["text/plain", "text/markdown", "application/pdf"]` | The accepted content types when uploading a file (must be supported by the cat) |
