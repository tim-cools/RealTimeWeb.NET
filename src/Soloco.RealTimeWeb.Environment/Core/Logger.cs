using System;
using System.IO;
using System.Runtime.CompilerServices;

namespace Soloco.RealTimeWeb.Environment.Core
{
    public class Logger : ILogger
    {
        private readonly object _lock = new object();
        private int _indent;
        private string _indentString;

        private class Log : IDisposable
        {
            private readonly Logger _logger;
            private readonly string _title;
            private readonly DateTime _start;

            public Log(Logger logger, string title, params object[] args)
            {
                _logger = logger;

                _title = string.Format(title, args);

                _logger.WriteLine(title, args);
                _logger.WriteLine();

                _logger.Indent(2);

                _start = DateTime.Now;
            }

            public void Dispose()
            {
                var duration = DateTime.Now - _start;

                _logger.Indent(-2);
                _logger.WriteLine("{0} Finished in {1}:{2}.{3}", _title,
                    (int)duration.TotalMinutes,
                    duration.Seconds,
                    duration.Milliseconds);
            }
        }

        public void WriteLine(string message, params object[] args)
        {
            message = message?.Replace(System.Environment.NewLine, System.Environment.NewLine + _indentString);
            Console.WriteLine(_indentString + message, args);
        }

        public void WriteLine()
        {
            Console.WriteLine(string.Empty);
        }

        public IDisposable Scope(string title, params object[] args)
        {
            return new Log(this, title, args);
        }

        private void Indent(int value)
        {
            _indent += value;
            _indentString = new string(' ', _indent);
        }
    }
}