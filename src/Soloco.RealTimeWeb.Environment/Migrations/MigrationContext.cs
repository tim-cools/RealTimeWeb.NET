using Soloco.RealTimeWeb.Environment.Core;

namespace Soloco.RealTimeWeb.Environment.Migrations
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