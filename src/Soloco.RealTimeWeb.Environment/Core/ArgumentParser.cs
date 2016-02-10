
using System;
using System.Collections.Generic;

namespace Soloco.RealTimeWeb.Environment.Core
{
    internal static class ArgumentParser
    {
        public static Arguments Parse(string[] args)
        {
            var command = MigrationCommand.Up;
            var settings = new List<string>();

            foreach (var arg in args)
            {
                switch (arg)
                {
                    case "--migrate-up":
                        command = MigrationCommand.Up;
                        break;

                    case "--migrate-down":
                        command = MigrationCommand.Down;
                        break;

                    default:
                        if (arg.StartsWith("--"))
                        {
                            throw new InvalidOperationException("Invalid command: " + arg);
                        }
                        settings.Add(arg);
                        break;
                }
            }

            return new Arguments(command, settings.ToArray());
        }
    }
}