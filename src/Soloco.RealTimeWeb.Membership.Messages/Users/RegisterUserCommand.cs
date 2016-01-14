using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;

namespace Soloco.RealTimeWeb.Membership.Messages.Users
{
    public class RegisterUserCommand : IMessage<Result>
    {
        public string UserName { get; }
        public string EMail { get; set; }
        public string Password { get; }

        public RegisterUserCommand(string userName, string eMail, string password)
        {
            UserName = userName;
            EMail = eMail;
            Password = password;
        }
    }
}
