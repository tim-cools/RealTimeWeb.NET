using System;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;

namespace Soloco.RealTimeWeb.Membership.Messages.RefreshTokens
{
    public class CreateRefreshTokenCommand : IMessage<Result>
    {
        public string TicketId { get; }

        public string ClientId { get; }
        public string UserId { get; }
        public string UserName { get; set; }

        public string IpAddress { get; }

        public DateTimeOffset ExpiresUtc { get; }
        public DateTimeOffset IssuedUtc { get; set; }

        public CreateRefreshTokenCommand(string ticketId, string clientId, string userId, string userName, string ipAddress, DateTimeOffset issuedUtc, DateTimeOffset expiresUtc)
        {
            TicketId = ticketId;
            ClientId = clientId;
            UserId = userId;
            UserName = userName;
            IpAddress = ipAddress;
            IssuedUtc = issuedUtc;
            ExpiresUtc = expiresUtc;
        }
    }
}
