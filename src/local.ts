const pluginPath = process.argv[2];
const userDataDir = process.argv[3];
const options = process.argv[4];
(async () => {
  await (
    await import(`${pluginPath}`)
  ).default(
    await (
      await import("@playwright/test")
    ).chromium.launchPersistentContext(`${userDataDir}`, {
      headless: false,
      viewport: { width: 1280, height: 720 },
      executablePath: (() => {
        switch (process.platform) {
          case "win32":
            return process.arch === "x64"
              ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
              : "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
          case "darwin":
            return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
          case "linux":
            return "/usr/bin/google-chrome";
          default:
            return undefined;
        }
      })(),
    }),
    JSON.parse(options)
  );
})();
