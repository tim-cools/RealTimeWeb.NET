using System;
using System.Linq;
using Microsoft.AspNet.Identity;
using Soloco.RealTimeWeb.Common;

namespace Soloco.RealTimeWeb.Membership.Domain
{
    public static class IdentityResultExtensions
    {
        public static CommandResult ToCommandResult(this IdentityResult result)
        {
            if (result == null) throw new ArgumentNullException(nameof(result));

            return result.Succeeded 
                ? CommandResult.Success 
                : CommandResult.Failed(result.Errors.Select(error => error.Code).ToArray());
        }

        public static void ThrowWhenFailed(this IdentityResult result, string message)
        {
            if (result == null) throw new ArgumentNullException(nameof(result));

            if (!result.Succeeded)
            {
                throw new BusinessException(message, result.Errors.Select(error => error.Code));
            }            
        }
    }
}