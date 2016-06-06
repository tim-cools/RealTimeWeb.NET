using System;
using System.Diagnostics;
using Soloco.RealTimeWeb.Environment.Core;
using Soloco.RealTimeWeb.Environment.Core.Configuration;

namespace Soloco.RealTimeWeb.Environment
{
    public class Program
    {
        static async void Main(string[] args)
        {
            var argument = ArgumentParser.Parse(args);
            var setting = new Settings(argument.Settings);
            var logger = new Logger();
            var context = new MigrationContext(logger, setting);
            var runner = new Runner(logger);

            if (argument.Command == MigrationCommand.Up)
            {
                await runner.Up(context);
            }
            else if (argument.Command == MigrationCommand.Down)
            {
                await runner.Down(context);
            }

            WaitForUserIfDebuggerAttached();
        }

        private static void WaitForUserIfDebuggerAttached()
        {
            if (Debugger.IsAttached)
            {
                Console.ReadLine();
            }
        }
    }
}
