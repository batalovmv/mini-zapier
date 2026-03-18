const fs = require('node:fs');
const path = require('node:path');

const MAX_COPY_RETRIES = 10;
const COPY_RETRY_DELAY_MS = 200;

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function copyFileWithRetries(sourcePath, targetPath) {
  for (let attempt = 0; attempt <= MAX_COPY_RETRIES; attempt += 1) {
    try {
      fs.copyFileSync(sourcePath, targetPath);
      return;
    } catch (error) {
      if (
        (error?.code === 'EBUSY' || error?.code === 'EPERM') &&
        attempt < MAX_COPY_RETRIES
      ) {
        sleep(COPY_RETRY_DELAY_MS * (attempt + 1));
        continue;
      }

      if (
        (error?.code === 'EBUSY' || error?.code === 'EPERM') &&
        fs.existsSync(targetPath)
      ) {
        return;
      }

      throw error;
    }
  }
}

function syncDirectoryContents(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      syncDirectoryContents(sourcePath, targetPath);
      continue;
    }

    if (entry.isFile()) {
      copyFileWithRetries(sourcePath, targetPath);
      continue;
    }

    if (entry.isSymbolicLink()) {
      const linkTarget = fs.readlinkSync(sourcePath);

      if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { recursive: true, force: true });
      }

      fs.symlinkSync(linkTarget, targetPath);
    }
  }
}

const clientDir = fs.realpathSync(
  path.dirname(require.resolve('@prisma/client/package.json')),
);
const generatedDir = path.join(path.dirname(path.dirname(clientDir)), '.prisma');
const targetDir = path.join(clientDir, 'node_modules', '.prisma');

syncDirectoryContents(generatedDir, targetDir);
