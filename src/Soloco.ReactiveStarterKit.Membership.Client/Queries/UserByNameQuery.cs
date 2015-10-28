using Soloco.ReactiveStarterKit.Common.Infrastructure.Commands;
using Soloco.ReactiveStarterKit.Membership.Client.Model;

namespace Soloco.ReactiveStarterKit.Membership.Client.Queries
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