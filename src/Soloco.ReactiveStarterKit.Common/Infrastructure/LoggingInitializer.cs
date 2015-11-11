using Serilog;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure
{
    public static class LoggingInitializer
    {
        public static void Initialize()
        {
            Log.Logger = new LoggerConfiguration()
                .WriteTo.ColoredConsole()
                .CreateLogger();
        }
    }
}