using Soloco.ReactiveStarterKit.Common.Infrastructure.Commands;
using Soloco.ReactiveStarterKit.Membership.Client.Model;

namespace Soloco.ReactiveStarterKit.Membership.Client.Queries
{
    public class UserByIdQuery : IMessage<User>
    {
        public string UserId { get; }

        public UserByIdQuery(string userId)
        {
            UserId = userId;
        }
    }
}