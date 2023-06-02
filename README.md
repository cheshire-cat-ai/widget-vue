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
    <cheshire-cat-chat api="none" url="localhost:1865" primary="#00ff00" dark="true"></cheshire-cat-chat>
</div>
```

The available attributes are:

```ts
url: string
api: string
dark?: boolean
primary?: string
secure?: boolean
timeout?: number
files?: ["text/plain", "text/markdown", "application/pdf"]
```
