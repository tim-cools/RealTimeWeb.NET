using System.Collections.Generic;

namespace Soloco.RealTimeWeb.Environment.Core
{
    internal class Arguments
    {
        public MigrationCommand Command { get; }
        public IDictionary<string, string> Settings { get; }

        public Arguments(MigrationCommand command, Dictionary<string, string> settings)
        {
            Command = command;
            Settings = settings;

        }
    }
}