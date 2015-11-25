using System;
using Soloco.ReactiveStarterKit.Common.Infrastructure;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;

namespace Soloco.ReactiveStarterKit.Membership.Messages.Commands
{
    public class CreateRefreshTokenCommand : IMessage<CommandResult>
    {
        public string ProtectedTicket { get; }
        public string Clientid { get; }
        public string Name { get; }
        public DateTimeOffset? IssuedUtc { get; }
        public DateTimeOffset? ExpiresUtc { get; }
        public string RefreshTokenId { get; }

        public CreateRefreshTokenCommand(string refreshTokenId, string protectedTicket, string clientid, string name, DateTimeOffset issuedUtc, DateTimeOffset expiresUtc)
        {
            RefreshTokenId = refreshTokenId;
            ProtectedTicket = protectedTicket;
            Clientid = clientid;
            Name = name;
            IssuedUtc = issuedUtc;
            ExpiresUtc = expiresUtc;
        }
    }
}
