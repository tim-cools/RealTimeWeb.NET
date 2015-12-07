using System;
using System.Collections.Generic;
using System.Linq;

namespace Soloco.RealTimeWeb.Common.Infrastructure
{
    public class CommandResult
    {
        private static readonly CommandResult _success = new CommandResult(true);
        public static CommandResult Success { get; } = _success;

        public bool Succeeded { get; }
        public IEnumerable<string> Errors { get; }

        private CommandResult(params string[] errors) : this((IEnumerable<string>) errors)
        {
        }

        public CommandResult(IEnumerable<string> errors)
        {
            if (errors == null)
            {
                errors = new[] { "System Error" };
            }

            Succeeded = false;
            Errors = errors;
        }

        private CommandResult(bool success)
        {
            Succeeded = success;
            Errors = new string[0];
        }

        public static CommandResult Failed(params string[] errors)
        {
            return new CommandResult(errors);
        }

        public CommandResult Merge(CommandResult second)
        {
            if (second == null) throw new ArgumentNullException(nameof(second));

            if (second.Succeeded && Succeeded)
            {
                return Success;
            }

            var combinedErrors = Errors.Union(second.Errors).ToArray();
            return Failed(combinedErrors);
        }
    }
}