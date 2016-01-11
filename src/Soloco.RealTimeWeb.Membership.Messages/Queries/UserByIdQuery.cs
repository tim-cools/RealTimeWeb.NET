using System;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Membership.Messages.Queries
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