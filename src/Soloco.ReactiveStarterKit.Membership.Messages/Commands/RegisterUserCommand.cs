using System;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Commands;

namespace Soloco.ReactiveStarterKit.Membership.Messages.Commands
{
    public class RegisterUserCommand : ICommandWithoutResult
    {
        public Guid UserId { get; set; }
    }
}
