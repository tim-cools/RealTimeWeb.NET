using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Membership.Messages.ViewModel;

namespace Soloco.ReactiveStarterKit.Membership.Messages.Queries
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