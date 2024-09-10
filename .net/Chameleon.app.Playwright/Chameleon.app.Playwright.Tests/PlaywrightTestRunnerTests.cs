using PlaywrightWrapper;
using System;
using System.Diagnostics;

namespace Chameleon.app.Playwright.Tests
{
    public class PlaywrightTestRunnerTests
    {
        private Process GrowserProcess(string cachepath, List<string> args) => new()
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "chrome.exe",
                Arguments = string.Join(" ", new List<string>(args)
                        {
                            "example.com",
                            "--restore-last-session",
                            "--disable-session-crashed-bubble",
                            "--hide-crash-restore-bubble",
                            "--profile-directory=Default",
                            "--disable-domain-reliability",
                            "--no-default-browser-check",
                            "--no-first-run",
                            "--disable-field-trial-config",
                            "--disable-hyperlink-auditing",
                            "--auto-open-devtools-for-tabs",
                            $"--user-data-dir=\"{cachepath}\"",
                        }),
                UseShellExecute = true,
                ErrorDialog = true,
                CreateNoWindow = true,
            },
            EnableRaisingEvents = true,
        };

        [Fact]
        public async Task TestGsite()
        {
            var cachepath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
            var port = 9669;
            var p = GrowserProcess(cachepath, [$"--remote-debugging-port={port}"]);
            p.Start();
            await Task.Delay(6000); // Wait for browser to start
            var runner = new PlaywrightTestRunner("node", "C:\\repos\\chameleon-playwright\\playwright-runner.mjs");
            try
            {
                runner.TestOutputReceived += (sender, output) => Debug.WriteLine($"Test output: {output}");
                runner.TestErrorReceived += (sender, error) => Debug.WriteLine($"Test error: {error}");
                await runner.SetConfigurationAsync(port);
                var data = new
                {
                    url = "https://sites.google.com/",
                    testEmail = "testjosh11011900@gmail.com",
                    testPW = "testjosh11011900@123",
                    textContent = "Anti-detect browser is capable of creating and running multiple digital identities that are not recognized by social platforms. This requires a lot of custom developer work, so such tools are generally not available for free. They are created to fight against tracking and analytics so that you can carry out your activities in private. In other words, an anti-fingerprint browser enhances privacy, keeps your data and web activities anonymous, and helps your web crawling tools avoid being blocked",
                    textSearch = "What is anti detect browser",
                    washington = "washington",
                    antidetect = "antidetectbrowsersexplanied5"
                };
                //await Task.Delay(1000); // 
                await runner.RunTestAsync("Gsite", data);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error running test: {ex.Message}");
                throw;
            }
            finally
            {
                await p.WaitForExitAsync();
                runner.Dispose();
                Directory.Delete(cachepath, true);
            }
        }
    }
}