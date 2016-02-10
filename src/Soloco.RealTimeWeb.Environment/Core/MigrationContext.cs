using Soloco.RealTimeWeb.Environment.Core.Configuration;

namespace Soloco.RealTimeWeb.Environment.Core
{
    public class MigrationContext
    {
        public ILogger Logger { get;  }
        public ISettings Settings { get; }

        public MigrationContext(ILogger logger, ISettings settings)
        {
            Logger = logger;
            Settings = settings;
        }
    }
}