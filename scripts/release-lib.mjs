// Pure helpers for the release flow. No git/fs side effects — unit-testable.

export function bumpVersion(version, part) {
  const parts = version.split('.').map(Number);
  let major = parts[0] || 0;
  let minor = parts[1] || 0;
  let patch = parts[2] || 0;
  switch (part) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`无效的 bump 类型: ${part}`);
  }
}

export function validateSemver(version) {
  if (!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(version)) {
    throw new Error(`版本号格式无效: ${version}（应为 x.y.z）`);
  }
}

export function hasOnlyAllowedWorkingTreeChange(porcelain, allowedPath) {
  if (!allowedPath) return false;
  const records = porcelain.split('\0').filter(Boolean);
  return records.length > 0 && records.every((record) => {
    const status = record.slice(0, 2);
    const filePath = record.slice(3);
    return ['??', ' M'].includes(status) && filePath === allowedPath;
  });
}

export function parseReleaseArgs(argv) {
  let bumpType = 'patch';
  let explicitVersion = '';
  let dryRun = false;
  let skipConfirm = false;
  let help = false;
  let notesFile = '';
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '-y' || arg === '--yes') {
      skipConfirm = true;
    } else if (arg === 'patch' || arg === 'minor' || arg === 'major') {
      bumpType = arg;
    } else if (/^v?[0-9]+\.[0-9]+\.[0-9]+$/.test(arg)) {
      explicitVersion = arg.replace(/^v/, '');
    } else if (arg === '-h' || arg === '--help') {
      help = true;
    } else if (arg === '--notes-file') {
      const filePath = argv[index + 1];
      if (!filePath || filePath.startsWith('-')) {
        throw new Error('--notes-file 需要提供文件路径');
      }
      notesFile = filePath;
      index += 1;
    } else {
      throw new Error(`未知参数: ${arg}\n运行 npm run release -- --help 查看用法`);
    }
  }
  return { help, bumpType, explicitVersion, dryRun, skipConfirm, notesFile };
}

export const RELEASE_HELP = `自动发布新版本：同步版本号 → 提交 → 打 tag → 推送到 origin 触发 GitHub Actions

用法:
  npm run release              # 自动 patch 递增 (v1.0.0 → v1.0.1)
  npm run release patch        # 同上
  npm run release minor        # v1.0.0 → v1.1.0
  npm run release major        # v1.0.0 → v2.0.0
  npm run release 1.0.1        # 指定具体版本
  npm run release -- --dry-run # 仅预览发布步骤，不实际修改
  npm run release -- -y patch  # 跳过交互式确认直接发布
  npm run r                    # 简写快捷命令
`;
