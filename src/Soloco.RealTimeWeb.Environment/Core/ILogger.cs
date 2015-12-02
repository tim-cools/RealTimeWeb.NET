using System;

namespace Soloco.RealTimeWeb.Environment.Core
{
    public interface ILogger
    {
        void WriteLine(string format, params object[] args);

        void WriteLine();

        IDisposable Scope(string title, params object[] args);
    }
}