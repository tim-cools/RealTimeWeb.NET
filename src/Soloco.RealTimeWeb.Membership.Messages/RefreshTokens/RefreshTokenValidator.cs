using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;

namespace Soloco.RealTimeWeb.Membership.Messages.RefreshTokens
{
    public class RefreshTokenValidator : IMessage<Result>
    {
        public string TicketId { get; set; }
        public string ClientId { get; set; }
        public string UserId { get; set; }

        public RefreshTokenValidator(string ticketId, string clientId, string userId)
        {
            TicketId = ticketId;
            ClientId = clientId;
            UserId = userId;
        }
    }
}