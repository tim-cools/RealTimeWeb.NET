using System;
using System.IO;
using System.Runtime.CompilerServices;

namespace Soloco.RealTimeWeb.Environment.Core
{
    public class Logger : ILogger
    {
        public void WriteLine(string message, params object[] args)
        {
            Console.WriteLine(message, args);
        }

        public void WriteLine()
        {
            WriteLine(string.Empty);
        }

        public IDisposable Scope(string title, params object[] args)
        {
            return new Log(this, title, args);
        }

        [MethodImpl(MethodImplOptions.Synchronized)]
        private static void LogSynchronized(string data, string file)
        {
            File.AppendAllText(file, data);
        }
    }
}