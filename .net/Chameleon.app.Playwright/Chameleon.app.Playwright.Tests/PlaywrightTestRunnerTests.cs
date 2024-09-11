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

	private async Task RunTestsInParallelAsync(IEnumerable<(string testName, object testData)> tests, int maxConcurrency = 3) {
		if (runner == null) {
			throw new InvalidOperationException("Runner is not initialized.");
		}

		var semaphore = new SemaphoreSlim(maxConcurrency);
		var tasks = tests.Select(async test => {
			await semaphore.WaitAsync();
			try {
				await runner.RunTestAsync(test.testName, test.testData);
			} finally {
				_ = semaphore.Release();
			}
		});

		await Task.WhenAll(tasks);
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

	[Fact]
	public async Task TestGsite() {
		_ = await _tcs.Task;
		runner = new PlaywrightTestRunner(IoC.Instance.Config);
		ArgumentNullException.ThrowIfNull(runner, nameof(runner));
		try {
			runner.TestOutputReceived += (sender, output) => Debug.WriteLine($"Test output: {output}");
			runner.TestErrorReceived += (sender, error) => Debug.WriteLine($"Test error: {error}");
			//todo Change
			//await runner.SetConfigurationAsync("cdpPort", port);

			//await Task.Delay(1000); // 
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
			// await runner.RunTestAsync("gsites", data);
			// await RunTestsInParallelAsync(new List<(string testName, object testData)>() { new("gsites", data) });
			if (browserProcess != null)
				await browserProcess.WaitForExitAsync();
			//await RunTestsInParallelAsync(new List<(string testName, object testData)>() { new("gsites", data) });
		} catch (Exception ex) {
			Console.WriteLine($"Error running test: {ex.Message}");
			throw;
		}
	}
	[Fact]
	public async Task TestStartProcess() {
		if (browserProcess != null) {

			_ = browserProcess?.Start();
			await browserProcess.WaitForExitAsync();
		}
	}
	public void Dispose() {
		if (browserProcess != null) {
			browserProcess.Kill();
			browserProcess.Dispose();
		}
		runner?.Dispose();
		if (Directory.Exists(cachePath)) {
			Directory.Delete(cachePath, true);
		}
		GC.SuppressFinalize(this);
	}
}
