
namespace Soloco.RealTimeWeb.Environment.Core
{
    internal class Arguments
    {
        public MigrationCommand Command { get; }

        public Arguments(MigrationCommand command)
        {
            Command = command;
        }
    }
}