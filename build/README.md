# Build Resources

Place your app icon here:

- `icon.ico` - Windows application icon (256x256 recommended)

The icon will be used for:
- Application window icon
- Installer icon
- Installed application icon in Start Menu and Desktop

## Creating an ICO file

You can create an `.ico` file from a PNG using online tools like:
- https://convertio.co/png-ico/
- https://www.icoconverter.com/

Or use a tool like ImageMagick:
```bash
magick convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

For now, the app will run without an icon (it will just use the default Electron icon).
