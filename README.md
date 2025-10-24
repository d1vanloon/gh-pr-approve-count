# GitHub Pull Request Approval Count

[![Release Build](https://github.com/d1vanloon/gh-pr-approve-count/actions/workflows/release.yml/badge.svg)](https://github.com/d1vanloon/gh-pr-approve-count/actions/workflows/release.yml)

<img src="icons/icon.png" alt="Extension Icon" width="128" height="128" />

Browser extension to display the number of approvals on the GitHub pull request list page.

## Building

### Prerequisites

- Node.js (version 16 or higher)
- npm (comes with Node.js)

### Build Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the extension:**
   ```bash
   npm run build
   ```

   This command will:
   - Clean the `dist` directory
   - Compile TypeScript files
   - Generate the manifest.json file
   - Copy icon files to the dist directory

3. **The built extension will be available in the `dist` folder**

## Development

### Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top-right corner
3. Click "Load unpacked"
4. Select the `dist` folder from this project
5. The extension should now appear in your extensions list and be active

### Loading the Extension in Microsoft Edge

1. Open Microsoft Edge and navigate to `edge://extensions/`
2. Enable "Developer mode" by toggling the switch in the left sidebar
3. Click "Load unpacked"
4. Select the `dist` folder from this project
5. The extension should now appear in your extensions list and be active

### Development Workflow

1. Make changes to the source files in the `src` directory
2. Run `npm run build` to rebuild the extension
3. In Chrome/Edge extensions page, click the refresh icon on your extension to reload it
4. Test your changes on GitHub pull request pages

### Project Structure

- `src/` - Source TypeScript files
- `scripts/` - Build scripts
- `icons/` - Extension icons
- `dist/` - Built extension files (generated)

