# markdown-table-rainbow

An extension that colorizes table columns in Markdown for clarity.

## Features

This extension colors by columns in markdown tables.

![demo](assets/demo.gif)

## Extension Settings

You can use it without any setting.
However, you can also change:

```js
  // Delay time in milliseconds before updating colors.
  // Smaller values will color faster, but will increase processing cost.
  "markdownTableRainbow.updateDelay": 100,
  // An array of color strings (hex, rgba, rgb) for each column.
  // You can specify any number of colors. used cyclically.
  "markdownTableRainbow.colors": [
    "rgba(79,236,236,0.1)",
    "rgba(255,255,63,0.1)",
    "rgba(127,255,127,0.1)",
    "rgba(255,127,255,0.1)"
  ],
  // Enable cursor column highlighting (default: true).
  "markdownTableRainbow.cursorColorEnabled": true,
  // Cursor column color strings (hex, rgba, rgb).
  "markdownTableRainbow.cursorColor": "rgba(100,50,180,0.8)",
```
