using System;
using System.Diagnostics;
using System.IO;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace PlaywrightWrapper
{
    public class PlaywrightTestRunner : IDisposable
    {
        private readonly JsonSerializerOptions jsonSerializerOptions = new()
        {
            WriteIndented = false,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        private Process? nodeProcess;
        private StreamWriter? processInput;
        private TcpClient? tcpClient;
        private NetworkStream? tcpStream;
        private bool isDisposed = false;

        public event EventHandler<string>? TestOutputReceived;
        public event EventHandler<string>? TestErrorReceived;

        public PlaywrightTestRunner(string nodePath, string scriptPath)
        {
            // Initialize the Node.js process
            var startInfo = new ProcessStartInfo
            {
                FileName = nodePath,
                Arguments = scriptPath,
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            nodeProcess = new Process { StartInfo = startInfo };
            nodeProcess.Start();

            processInput = nodeProcess.StandardInput;

            // Use Tasks to read output and error streams asynchronously
            _ = ReadOutputAsync(nodeProcess.StandardOutput);
            _ = ReadOutputAsync(nodeProcess.StandardError, isError: true);
        }

        private async Task ReadOutputAsync(StreamReader reader, bool isError = false)
        {
            try
            {
                string? line;
                while ((line = await reader.ReadLineAsync()) != null)
                {
                    if (isError)
                        TestErrorReceived?.Invoke(this, line);
                    else
                        TestOutputReceived?.Invoke(this, line);
                }
            }
            catch (Exception ex)
            {
                TestErrorReceived?.Invoke(this, $"Error reading from {(isError ? "error" : "output")} stream: {ex.Message}");
            }
        }

        public async Task RunTestAsync(string testName, object testData)
        {
            ObjectDisposedException.ThrowIf(isDisposed, nameof(PlaywrightTestRunner));

            // Serialize the entire command and data as a single JSON object
            var command = new { action = "runTest", name = testName, data = testData };
            string jsonCommand = JsonSerializer.Serialize(command, jsonSerializerOptions);

            // Send JSON command via stdin
            await processInput!.WriteLineAsync(jsonCommand);
        }

        public async Task SetConfigurationAsync(int cdpPort)
        {
            ObjectDisposedException.ThrowIf(isDisposed, nameof(PlaywrightTestRunner));

            // Serialize the entire command and data as a single JSON object
            var config = new { action = "setConfig", key = "cdpPort", value = cdpPort };
            string jsonConfig = JsonSerializer.Serialize(config, jsonSerializerOptions);

            // Send JSON command via stdin
            await processInput!.WriteLineAsync(jsonConfig);
        }

        public void Dispose()
        {
            if (!isDisposed)
            {
                nodeProcess?.Kill();
                nodeProcess?.Dispose();
                isDisposed = true;
            }
        }
    }
}