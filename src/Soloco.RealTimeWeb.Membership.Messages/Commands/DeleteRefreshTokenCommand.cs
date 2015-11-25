using System;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;

namespace Soloco.ReactiveStarterKit.Membership.Messages.Commands
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
