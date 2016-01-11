using System;
using System.Collections.Generic;
using System.Linq;

namespace Soloco.RealTimeWeb.Common
{
    public class CommandResult
    {
        private static readonly CommandResult _success = new CommandResult(true);
        public static CommandResult Success { get; } = _success;

        public bool Succeeded { get; internal set; }
        public IEnumerable<string> Errors { get; internal set; }

        public CommandResult()
        {
        }

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

        protected CommandResult(bool success)
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