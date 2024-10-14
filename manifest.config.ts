import { env } from 'node:process'
import type { ManifestV3Export } from '@crxjs/vite-plugin'
import packageJson from './package.json'

const { version, name, description, displayName } = packageJson
const [major, minor, patch, label = '0'] = version
  .replace(/[^\d.-]+/g, '')
  .split(/[.-]/)

export default {
  name: env.mode === 'staging' ? `[INTERNAL] ${name}` : displayName || name,
  description,
  version: `${major}.${minor}.${patch}.${label}`,
  version_name: version,
  manifest_version: 3,
  action: {
    default_popup: 'src/popup/index.html',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      all_frames: true,
      js: ['src/content-script/index.ts'],
      matches: ['<all_urls>'],
      run_at: 'document_end',
    },
  ],
  options_page: 'src/options/index.html',
  offline_enabled: true,
  permissions: ['storage', 'activeTab', 'tabs'],
  host_permissions: ['<all_urls>'],
  web_accessible_resources: [
    {
      matches: ['<all_urls>'],
      resources: ['src/content-script/index.ts'],
    },
  ],
  icons: {
    16: 'src/assets/logo.png',
    24: 'src/assets/logo.png',
    32: 'src/assets/logo.png',
    128: 'src/assets/logo.png',
  },
} as ManifestV3Export