using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Soloco.RealTimeWeb.Common
{
    public class Result
    {
        private static readonly Result _success = new Result(true);
        public static Result Success { get; } = _success;

        public bool Succeeded { get; internal set; }
        public IEnumerable<string> Errors { get; internal set; }

        public Result()
        {
        }

        private Result(params string[] errors) : this((IEnumerable<string>) errors)
        {
        }

        public Result(IEnumerable<string> errors)
        {
            if (errors == null)
            {
                errors = new[] { "System Error" };
            }

            Succeeded = false;
            Errors = errors;
        }

        protected Result(bool success)
        {
            Succeeded = success;
            Errors = new string[0];
        }

        public static Result Failed(params string[] errors)
        {
            return new Result(errors);
        }

        public Result Merge(Result second)
        {
            if (second == null) throw new ArgumentNullException(nameof(second));

            if (second.Succeeded && Succeeded)
            {
                return Success;
            }

            var combinedErrors = Errors.Union(second.Errors).ToArray();
            return Failed(combinedErrors);
        }

        public override string ToString()
        {
            var errors = new StringBuilder();
            foreach (var error in Errors)
            {
                errors.AppendLine(" > " + error);
            }
            return (Succeeded ? "Succeeded" : "Failed:") + errors;
        }
    }
}