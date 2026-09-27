import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

export default async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return

  const appName = `${context.packager.appInfo.productFilename}.app`
  const appPath = path.join(context.appOutDir, appName)
  const entitlements = path.join(context.packager.projectDir, 'build', 'entitlements.mac.plist')

  // Check if already signed with a real certificate
  let isAdhocOrUnsigned = true
  try {
    const output = execSync(`codesign -dvvv "${appPath}" 2>&1`, { encoding: 'utf8' })
    if (output.includes('Authority=Developer ID Application') || output.includes('Authority=Apple Development')) {
      isAdhocOrUnsigned = false
    }
  } catch {
    isAdhocOrUnsigned = true
  }

  if (isAdhocOrUnsigned) {
    console.log(`[afterPack] Ad-hoc signing macOS app bundle at ${appPath}...`)
    const entitlementsFlag = fs.existsSync(entitlements) ? `--entitlements "${entitlements}"` : ''
    try {
      execSync(`codesign --force --deep --sign - ${entitlementsFlag} "${appPath}"`, { stdio: 'inherit' })
      console.log(`[afterPack] Successfully ad-hoc signed ${appName}`)
    } catch (err) {
      console.warn(`[afterPack] Failed to ad-hoc sign ${appName}:`, err)
    }
  }
}
