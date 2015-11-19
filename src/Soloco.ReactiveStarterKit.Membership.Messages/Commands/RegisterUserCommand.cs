using Soloco.ReactiveStarterKit.Common.Infrastructure;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;

namespace Soloco.ReactiveStarterKit.Membership.Messages.Commands
{
    public class RegisterUserCommand : IMessage<CommandResult>
    {
        public string UserName { get; }
        public string Password { get; }

        public RegisterUserCommand(string userName, string password)
        {
            UserName = userName;
            Password = password;
        }
    }
}
