using Soloco.RealTimeWeb.Environment.Core.Configuration;

namespace Soloco.RealTimeWeb.Environment.Core
{
    public class MigrationContext
    {
        public ILogger Logger { get;  }
        public Settings Settings { get; }

        public MigrationContext(ILogger logger, Settings settings)
        {
            Logger = logger;
            Settings = settings;
        }
    }
}