using System;

namespace Soloco.RealTimeWeb.Environment.Core
{
    internal class Log : IDisposable
    {
        private readonly ILogger _logger;
        private readonly string _title;
        private readonly DateTime _start;

        public Log(ILogger logger, string title, params object[] args)
        {
            _logger = logger;
            _title = string.Format(title, args);

            _logger.WriteLine(title, args);
            _logger.WriteLine();

            _start = DateTime.Now;
        }

        public void Dispose()
        {
            var duration = DateTime.Now - _start;
            _logger.WriteLine("{0} Finished in {1}:{2}.{3}", _title,
                (int) duration.TotalMinutes,
                duration.Seconds,
                duration.Milliseconds);
        }
    }
}