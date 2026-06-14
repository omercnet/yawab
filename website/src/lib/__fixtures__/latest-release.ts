const assetNames = [
  'Yawab-1.0.3-arm64.dmg',
  'Yawab-1.0.3-x64.dmg',
  'Yawab-1.0.3-setup-x64.exe',
  'Yawab-1.0.3-setup-arm64.exe',
  'Yawab-1.0.3-setup.exe',
  'Yawab-1.0.3-x86_64.AppImage',
  'Yawab-1.0.3-amd64.deb',
  'Yawab-1.0.3-arm64.dmg.blockmap',
  'Yawab-1.0.3-x64.dmg.blockmap',
  'Yawab-1.0.3-setup-x64.exe.blockmap',
  'Yawab-1.0.3-setup-arm64.exe.blockmap',
  'Yawab-1.0.3-setup.exe.blockmap',
  'latest.yml',
  'latest-mac.yml',
  'latest-linux.yml'
]

export const releaseFixture = {
  tag_name: 'v1.0.3',
  assets: assetNames.map((name) => ({
    name,
    browser_download_url: `https://github.com/omercnet/yawab/releases/download/v1.0.3/${name}`
  }))
}
