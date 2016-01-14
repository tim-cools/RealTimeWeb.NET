using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Membership.Messages.Users
{
    public class UserNamePasswordLogin : IMessage<LoginResult>
    {
        public string UserName { get; }
        public string Password { get; }

        public UserNamePasswordLogin(string userName, string password)
        {
            UserName = userName;
            Password = password;
        }
    }
}