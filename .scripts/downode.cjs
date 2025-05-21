const fs = require('fs');
const path = require('path');
const https = require('https');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

// For extraction
let extractZip, extractTarGz;

try {
  // Try to load the extraction libraries
  const unzipper = require('unzipper');
  const tar = require('tar');
  
  extractZip = async (zipPath, destDir) => {
    return new Promise((resolve, reject) => {
      fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: destDir }))
        .on('close', resolve)
        .on('error', reject);
    });
  };
  
  extractTarGz = async (tarPath, destDir) => {
    await tar.extract({
      file: tarPath,
      cwd: destDir
    });
  };
} catch (err) {
  console.warn('Warning: unzipper and/or tar modules not found. Will use system commands for extraction.');
  
  // Fallbacks using system commands
  extractZip = async (zipPath, destDir) => {
    if (process.platform === 'win32') {
      // On Windows, use PowerShell's Expand-Archive
      await execAsync(`powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`);
    } else {
      // On other platforms, use unzip
      await execAsync(`unzip -o "${zipPath}" -d "${destDir}"`);
    }
  };
  
  extractTarGz = async (tarPath, destDir) => {
    await execAsync(`tar -xzf "${tarPath}" -C "${destDir}"`);
  };
}

// Configuration - use current running Node.js version
const NODE_VERSION = process.version; // E.g. 'v16.20.2'
console.log(`Current running Node.js version: ${NODE_VERSION}`);
const DOWNLOAD_DIR = path.join(__dirname, '.cache/node-binaries');

// Make sure download directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// Define target platforms
const platforms = [
  {
    os: 'win',
    arch: 'x64',
    ext: 'zip',
    extract: extractZip
  },
  {
    os: 'darwin',
    arch: 'x64',
    ext: 'tar.gz',
    extract: extractTarGz
  }
];

/**
 * Download a file from a URL
 */
async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading from ${url} to ${destPath}`);
    
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        fs.unlinkSync(destPath);
        reject(new Error(`Failed to download, status code: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlinkSync(destPath);
        reject(err);
      });
    }).on('error', (err) => {
      fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

/**
 * Download and extract Node.js for a specific platform
 */
async function downloadNodeForPlatform(platform) {
  const { os, arch, ext, extract } = platform;
  
  // Determine file names and paths
  const fileName = `node-${NODE_VERSION}-${os}-${arch}.${ext}`;
  const downloadUrl = `https://nodejs.org/dist/${NODE_VERSION}/${fileName}`;
  const downloadPath = path.join(DOWNLOAD_DIR, fileName);
  const extractDir = path.join(DOWNLOAD_DIR, `${os}-${arch}`);
  
  console.log(`\n=== Downloading Node.js ${NODE_VERSION} for ${os}-${arch} ===`);
  
  // Create extract directory
  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir, { recursive: true });
  }
  
  // Download the file if it doesn't exist
  if (!fs.existsSync(downloadPath)) {
    try {
      await downloadFile(downloadUrl, downloadPath);
      console.log(`Downloaded to ${downloadPath}`);
    } catch (err) {
      console.error(`Error downloading Node.js for ${os}-${arch}:`, err.message);
      return;
    }
  } else {
    console.log(`${downloadPath} already exists, skipping download`);
  }
  
  // Extract the file
  try {
    console.log(`Extracting to ${extractDir}...`);
    await extract(downloadPath, extractDir);
    console.log(`Extracted Node.js for ${os}-${arch}`);
  } catch (err) {
    console.error(`Error extracting Node.js for ${os}-${arch}:`, err.message);
    return;
  }
  
  // Find the executable
  const folderName = `node-${NODE_VERSION}-${os}-${arch}`;
  const nodeBinPath = os === 'win' 
    ? path.join(extractDir, folderName, 'node.exe')
    : path.join(extractDir, folderName, 'bin', 'node');
  
  if (!fs.existsSync(nodeBinPath)) {
    console.error(`Error: Node.js executable not found at ${nodeBinPath}`);
    return;
  }
  
  // Copy the executable to a simpler location
  const simpleBinPath = path.join(DOWNLOAD_DIR, os === 'win' ? 'node.exe' : `node`);
  fs.copyFileSync(nodeBinPath, simpleBinPath);
  
  // Make file executable on macOS
  if (os === 'darwin') {
    try {
      await execAsync(`chmod +x "${simpleBinPath}"`);
    } catch (err) {
      console.warn(`Warning: Could not make ${simpleBinPath} executable:`, err.message);
    }
  }
  
  console.log(`Node.js binary ready at: ${simpleBinPath}`);
  return simpleBinPath;
}

/**
 * Create simple launcher scripts
 */
function createLauncherScripts() {
  // For Windows
  const winBatchContent = `@echo off\r\n"%~dp0node.exe" %*`;
  fs.writeFileSync(path.join(DOWNLOAD_DIR, 'node-win.cmd'), winBatchContent);
  
  // For macOS
  const macShContent = `#!/bin/bash\ndir="$(cd "$(dirname "$0")" && pwd)"\n"$dir/node-darwin" "$@"`;
  fs.writeFileSync(path.join(DOWNLOAD_DIR, 'node-mac.sh'), macShContent);
  try {
    execAsync(`chmod +x "${path.join(DOWNLOAD_DIR, 'node-mac.sh')}"`);
  } catch (err) {
    console.warn(`Warning: Could not make launcher script executable:`, err.message);
  }
  
  console.log(`Created launcher scripts in ${DOWNLOAD_DIR}`);
}

/**
 * Main function
 */
async function main() {
  const [download] = process.argv.slice(2);
 const binaries = [path.join(DOWNLOAD_DIR, 'node.exe'), path.join(DOWNLOAD_DIR, 'node')];
 for (const bin of binaries) {
   // copy the binary to a new location
   if (fs.existsSync(bin)) {
     const newBinPath = path.join(
       "/Users/dev/src/Chameleon-lib/Chameleon.Assets/js/node",
       path.basename(bin)
     );
     fs.copyFileSync(bin, newBinPath);
     console.log(`Copied binary to ${newBinPath}`);
   } else {
     console.warn(`Warning: Binary not found at ${bin}`);
   }
 }
  
  if (!download) return;
  console.log(`Downloading Node.js ${NODE_VERSION} for multiple platforms`);
  
  const results = [];
  for (const platform of platforms) {
    try {
      const binPath = await downloadNodeForPlatform(platform);
      if (binPath) {
        results.push({
          platform: platform.os,
          path: binPath,
          success: true
        });
      }
    } catch (err) {
      console.error(`Failed to download Node.js for ${platform.os}:`, err);
      results.push({
        platform: platform.os,
        success: false,
        error: err.message
      });
    }
  }
  
  // Create launcher scripts
  createLauncherScripts();
  
  // Print summary
  console.log('\n=== Download Summary ===');
  for (const result of results) {
    if (result.success) {
      console.log(`✓ ${result.platform}: ${result.path}`);
    } else {
      console.log(`✗ ${result.platform}: ${result.error}`);
    }
  }
  
  // Create a simple script to test the node binaries
  const testFilePath = path.join(DOWNLOAD_DIR, 'test.js');
  fs.writeFileSync(testFilePath, 'console.log(`Node.js ${process.version} is working!`);');
  console.log(`\nTest script created at: ${testFilePath}`);
  console.log('You can test the binaries with:');
  console.log(`- Windows: ${path.join(DOWNLOAD_DIR, 'node-win.cmd')} ${testFilePath}`);
  console.log(`- macOS: ${path.join(DOWNLOAD_DIR, 'node-mac.sh')} ${testFilePath}`);
  
  // Create a package.json backup
  if (fs.existsSync('package.json')) {
    const packageJson = require('../package.json');
    const nodeInfo = {
      nodeVersion: NODE_VERSION,
      downloadDate: new Date().toISOString(),
      binaries: results.filter(r => r.success).map(r => ({ platform: r.platform, path: r.path }))
    };
    fs.writeFileSync(
      path.join(DOWNLOAD_DIR, 'node-info.json'), 
      JSON.stringify(nodeInfo, null, 2)
    );
    console.log(`\nNode version info saved to ${path.join(DOWNLOAD_DIR, 'node-info.json')}`);
  }
}

// Run the main function
main().catch(err => {
  console.error('Error in main process:', err);
  process.exit(1);
});