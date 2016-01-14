using System;
using Soloco.RealTimeWeb.Common.Messages;

namespace Soloco.RealTimeWeb.Membership.Messages.Users
{
    public class UserByIdQuery : IMessage<User>
    {
        public Guid Id { get; }

        public UserByIdQuery(Guid id)
        {
            Id = id;
        }
    }
}