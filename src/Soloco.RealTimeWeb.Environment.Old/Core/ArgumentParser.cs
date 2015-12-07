using System;
using System.Collections.Generic;

namespace Soloco.RealTimeWeb.Environment.Core
{
    internal static class ArgumentParser
    {
        public static Arguments Parse(string[] args)
        {
            var result = new Dictionary<string, string>();
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

                    default:
                        ParseArgument(arg, result);
                        break;
                }
            }

            return new Arguments(command, result);
        }

        private static void ParseArgument(string arg, Dictionary<string, string> result)
        {
            var parts = arg.Split('=');
            if (parts.Length != 2)
            {
                throw new InvalidOperationException($"Invalid argument: '{arg}' Argument should be: key=value");
            }

            var key = parts[0].Trim('"');
            var value = parts[1].Trim('"');

            result.Add(key, value);
        }
    }
}