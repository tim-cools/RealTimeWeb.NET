using System;
using System.Diagnostics;
using Soloco.RealTimeWeb.Environment.Core;

namespace Soloco.RealTimeWeb.Environment
{
    public class Program
    {
        static void Main(string[] args)
        {
            var argument = ArgumentParser.Parse(args);
            var setting = new Settings(argument.Settings);
            var logger = new Logger();
            var runner = new Runner(logger);

            if (argument.Command == MigrationCommand.Up)
            {
                runner.Up(setting);
            }
            else if (argument.Command == MigrationCommand.Up)
            {
                runner.Down(setting);
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
