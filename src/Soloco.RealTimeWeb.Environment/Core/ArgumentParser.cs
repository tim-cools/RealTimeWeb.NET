
namespace Soloco.RealTimeWeb.Environment.Core
{
    internal static class ArgumentParser
    {
        public static Arguments Parse(string[] args)
        {
            var command = MigrationCommand.Up;

            foreach (var arg in args)
            {
                switch (arg)
                {
                    case "--up":
                        command = MigrationCommand.Up;
                        break;

                    case "--down":
                        command = MigrationCommand.Down;
                        break;
                }
            }

            return new Arguments(command);
        }
    }
}