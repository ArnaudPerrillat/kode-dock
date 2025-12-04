# KodeDock

A modern Windows desktop application built with Electron and React for organizing and managing your development projects. Organize projects into workspaces and open them directly in VSCode with a single click.

## Features

- **Workspace Management**: Organize your projects into multiple workspaces
- **Project Cards**: Visual cards displaying project information, tags, and quick actions
- **VSCode Integration**: Open any project directly in VSCode with one click
- **Tags**: Categorize your projects with custom tags
- **Modern UI**: Clean, responsive interface built with shadcn/ui and Tailwind CSS
- **Local Storage**: All data stored locally in JSON format
- **Cross-platform Ready**: Built on Electron (currently configured for Windows)

## Tech Stack

- **Electron** - Desktop application framework
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful component library
- **electron-builder** - Package and build for Windows

## Prerequisites

Before you begin, ensure you have installed:

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [VSCode](https://code.visualstudio.com/) (for opening projects)
- VSCode must be added to your system PATH

### Verify VSCode is in PATH

Open a terminal and run:
```bash
code --version
```

If this command works, you're all set! If not, you'll need to add VSCode to your PATH:
1. Open VSCode
2. Press `Ctrl+Shift+P`
3. Type "Shell Command: Install 'code' command in PATH"
4. Select it and restart your terminal

## Installation

1. **Clone or download this repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

## Development

### Run in Development Mode

To run the application in development mode with hot-reload:

```bash
npm run electron:dev
```

This will:
- Start the Vite dev server
- Launch the Electron application
- Enable hot module replacement for React components
- Open DevTools automatically

### Development Tips

- The app window will open automatically at `http://localhost:5173`
- DevTools are opened by default in dev mode
- Changes to React components will hot-reload
- Changes to Electron main/preload require app restart

## Building for Production

### Build the Application

To create a production build:

```bash
npm run build
```

This compiles TypeScript and bundles the React application.

### Create Windows Installer

To create a Windows `.exe` installer:

```bash
npm run electron:build
```

Or specifically for Windows:

```bash
npm run electron:build:win
```

The installer will be created in the `release` folder:
- `release/KodeDock Setup X.X.X.exe` - NSIS installer

### Distribution

After building, you can distribute the `.exe` installer to other Windows machines. Users can install KodeDock like any other Windows application.

## Project Structure

```
kode-dock/
├── electron/               # Electron main process files
│   ├── main.ts            # Main process (window management, IPC)
│   └── preload.ts         # Preload script (secure IPC bridge)
├── src/                   # React application source
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── Sidebar.tsx   # Workspace sidebar
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectGrid.tsx
│   │   └── AddProjectDialog.tsx
│   ├── lib/              # Utility functions
│   │   ├── storage.ts    # Data persistence layer
│   │   └── utils.ts      # Helper utilities
│   ├── types/            # TypeScript type definitions
│   │   ├── index.ts
│   │   └── electron.d.ts
│   ├── App.tsx           # Main React component
│   ├── main.tsx          # React entry point
│   └── index.css         # Global styles
├── dist/                 # Built React app (generated)
├── dist-electron/        # Built Electron files (generated)
├── release/              # Built installers (generated)
├── index.html            # HTML entry point
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── README.md             # This file
```

## Usage Guide

### Creating a Workspace

1. Click the **+** button next to "WORKSPACES" in the sidebar
2. Enter a name for your workspace
3. Press Enter or click the checkmark

### Managing Workspaces

- **Select**: Click on a workspace name to view its projects
- **Rename**: Hover over a workspace and click the edit icon
- **Delete**: Hover over a workspace and click the trash icon

### Adding a Project

1. Select a workspace
2. Click the **Add Project** button
3. Fill in the project details:
   - **Name**: Required - Display name for your project
   - **Path**: Required - Click the folder icon to browse for the project folder
   - **Description**: Optional - Brief description of the project
   - **Tags**: Optional - Add tags to categorize your project
4. Click **Add Project**

### Opening in VSCode

Click the **Open in VSCode** button on any project card. The project will open in a new VSCode window.

If you see an error:
- Verify VSCode is installed
- Ensure `code` command is available in your PATH
- Check that the project path is correct and exists

### Deleting a Project

Hover over a project card and click the trash icon in the top-right corner.

**Note**: This only removes the project from KodeDock - it does not delete any files from your computer.

## Data Storage

All data is stored locally in a JSON file:
- **Location**: `%APPDATA%\kodedock\kodedock-data.json` (Windows)
- **Format**: JSON
- **Contents**: Workspaces and projects

### Data Structure

```json
{
  "workspaces": [
    {
      "id": "unique-id",
      "name": "Workspace Name",
      "projects": [
        {
          "id": "unique-id",
          "name": "Project Name",
          "path": "C:\\Projects\\my-project",
          "description": "Optional description",
          "tags": ["react", "typescript"],
          "createdAt": "2025-01-01T00:00:00.000Z"
        }
      ]
    }
  ]
}
```

## Troubleshooting

### VSCode won't open

**Problem**: Clicking "Open in VSCode" shows an error

**Solutions**:
1. Verify VSCode is installed
2. Run `code --version` in terminal to check if it's in PATH
3. Add VSCode to PATH (see Prerequisites section)
4. Restart KodeDock after fixing PATH

### Application won't start

**Problem**: App doesn't launch or crashes immediately

**Solutions**:
1. Delete `node_modules` and run `npm install` again
2. Clear the build folders: `dist` and `dist-electron`
3. Run `npm run build` then `npm run electron:dev`
4. Check console for error messages

### Build fails

**Problem**: `npm run electron:build` fails

**Solutions**:
1. Ensure all dependencies are installed: `npm install`
2. Run `npm run build` first to compile React app
3. Check that `electron-builder` is installed correctly
4. Verify you have enough disk space

### Projects not persisting

**Problem**: Projects disappear after closing the app

**Solutions**:
1. Check if the app has write permissions to `%APPDATA%`
2. Look for error messages in the console
3. Manually check if the data file exists and is readable

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server only |
| `npm run build` | Build React app for production |
| `npm run preview` | Preview production build locally |
| `npm run electron:dev` | Run app in development mode |
| `npm run electron:build` | Build Windows installer |
| `npm run electron:build:win` | Build Windows installer (explicit) |

## Customization

### Changing the App Icon

1. Create a `.ico` file (256x256 recommended)
2. Place it in `build/icon.ico`
3. Rebuild the application

### Modifying UI Colors

Edit the CSS variables in [src/index.css](src/index.css#L6-L29) to change the color scheme.

### Adding Features

The codebase is well-structured and ready for extensions:
- **New IPC handlers**: Add to [electron/main.ts](electron/main.ts)
- **New components**: Create in `src/components/`
- **New storage functions**: Add to [src/lib/storage.ts](src/lib/storage.ts)

## License

MIT

## Contributing

Feel free to submit issues and pull requests!

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
