
using System.Collections.Generic;

namespace Soloco.RealTimeWeb.Environment.Core
{
    internal class Arguments
    {
        public MigrationCommand Command { get; }
        public string[] Settings { get; }

        public Arguments(MigrationCommand command, string[] settings)
        {
            Command = command;
            Settings = settings;
        }
    }
}