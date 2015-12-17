using System;
using Soloco.RealTimeWeb.Common.Messages;

namespace Soloco.RealTimeWeb.Membership.Messages.Commands
{
    public class DeleteRefreshTokenCommand : ICommand
    {
        public Guid TokenId { get; }

        public DeleteRefreshTokenCommand(Guid tokenId)
        {
            TokenId = tokenId;
        }
    }
}
