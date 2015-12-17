using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Membership.Messages.Queries
{
    public class UserByNameQuery : IMessage<User>
    {
        public string UserName { get; }

        public UserByNameQuery(string userName)
        {
            UserName = userName;
        }
    }
}