using Chameleon.app.Playwright.node;
using Chameleon.lib.Common;
using Chameleon.lib.Common.Extensions;
using Chameleon.lib.Common.Util;

using System;
using System.Diagnostics;

namespace Chameleon.app.Playwright.Tests;

public class PlaywrightTestRunnerTests : IDisposable {
	private readonly TaskCompletionSource<bool> _tcs = new();

	private string? cachePath;
	private Process? browserProcess;
	private PlaywrightTestRunner? runner;
	private int port = 9669;

	public PlaywrightTestRunnerTests() {
		void setup(bool init) {
			// Setup code
			port = Netil.NextFreePort(port);
			cachePath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
			browserProcess = GrowserProcess(cachePath, [$"--remote-debugging-port={port}"]);

			_tcs.SetResult(true);
		}
		// Setup IoC
		IoC.Instance.Init(action: setup);
	}

	private async Task RunTestsInParallelAsync(IEnumerable<(string testName, int port, object testData)> tests, int maxConcurrency = 3) {
		if (runner == null) {
			throw new InvalidOperationException("Runner is not initialized.");
		}

		var semaphore = new SemaphoreSlim(maxConcurrency);
		var tasks = tests.Select(async test => {
			await semaphore.WaitAsync();
			try {
				TaskCompletionSource<bool> tcs = new();
				runner.TestOutputReceived += (sender, output) => {
					if(output == $"Test {test.testName} completed finally block") {
						tcs.SetResult(true);
					}
				};
				await runner.RunTestAsync(test.testName, test.testData);
				_ = await tcs.Task;
			} finally {
				await Task.Delay(1000);
				_ = semaphore.Release();
			}
		});

		await Task.WhenAll(tasks);
	}

	[Fact]
	public async Task TestGsite() {
		await LaunchBrowser();

		runner = new PlaywrightTestRunner(IoC.Instance.Config);
		try {
			runner.TestOutputReceived += (sender, output) => Debug.WriteLine($"Test output: {output}");
			runner.TestErrorReceived += (sender, error) => Debug.WriteLine($"Test error: {error}");
			var data = new
			{
				url = "https://sites.google.com/",
				testEmail = "testjosh11011900@gmail.com",
				testPW = "testjosh11011900@123",
				textContent = "Anti-detect browser is capable of creating and running multiple digital identities that are not recognized by social platforms. This requires a lot of custom developer work, so such tools are generally not available for free. They are created to fight against tracking and analytics so that you can carry out your activities in private. In other words, an anti-fingerprint browser enhances privacy, keeps your data and web activities anonymous, and helps your web crawling tools avoid being blocked",
				textSearch = "What is anti detect browser",
				washington = "washington",
				antidetect = "antidetectbrowsersexplanied5",
				gsiteTitle = "GsiteTitle"
			};
			await RunTestsInParallelAsync(new List<(string testName,int port, object testData)>() { new("gsites", port, data) });
			//DisposeBrowser();
			//if (browserProcess != null)
			//	await browserProcess.WaitForExitAsync();
		} catch (Exception ex) {
			Console.WriteLine($"Error running test: {ex.Message}");
			throw;
		} finally {
			runner.Dispose();
		}
	}

	[Fact]
	public async Task TestStartProcess() {
		if (browserProcess != null) {
			await LaunchBrowser();
			await browserProcess.WaitForExitAsync();
		}
	}

	private static Process GrowserProcess(string cachepath, List<string> args) => new() {
		StartInfo = new ProcessStartInfo {
			FileName = IoC.GetValue<string>("BrowserPath"),
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
						$"--user-data-dir=\"{cachepath}\"",
				}),
			UseShellExecute = true,
			ErrorDialog = true,
			CreateNoWindow = true,
		},
		EnableRaisingEvents = true,
	};

	private async Task LaunchBrowser() {
		_ = await _tcs.Task;
		_ = browserProcess!.Start();
		await Task.Delay(2000);
	}
	private void DisposeBrowser() {
		if (browserProcess != null) {
			browserProcess.Kill();
			browserProcess.Dispose();
		}
	}
	public async void Dispose() {
		DisposeBrowser();
		runner?.Dispose();
		await Task.Delay(2000);
		if (Directory.Exists(cachePath)) {
			Directory.Delete(cachePath, true);
		}
		GC.SuppressFinalize(this);
	}
}
