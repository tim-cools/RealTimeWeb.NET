using Microsoft.AspNet.Identity;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Commands;

namespace Soloco.ReactiveStarterKit.Membership.Messages.Commands
{
    public class RegisterUserCommand : IMessage<IdentityResult>
    {
        public string UserName { get; private set; }
        public string Password { get; private set; }

        public RegisterUserCommand(string userName, string password)
        {
            UserName = userName;
            Password = password;
        }
    }
}
