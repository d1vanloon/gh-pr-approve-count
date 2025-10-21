import fs from "node:fs";
import path from "node:path";
import { version } from "../package.json";

const manifest: chrome.runtime.ManifestV3 = {
  manifest_version: 3,
  name: "GitHub Pull Request Approval Count",
  version,
  description: "Shows approval count badges on GitHub pull requests",
  host_permissions: ["https://github.com/*"],
  content_scripts: [
    {
      matches: ["https://github.com/*/pulls*", "https://github.com/pulls*"],
      js: ["content.js"],
      run_at: "document_idle",
    },
  ],
  icons: {
    16: "icon16.png",
    48: "icon48.png",
    128: "icon128.png",
  },
};

fs.writeFileSync(
  path.resolve(__dirname, `../dist/manifest.json`),
  JSON.stringify(manifest, null, 2)
);
