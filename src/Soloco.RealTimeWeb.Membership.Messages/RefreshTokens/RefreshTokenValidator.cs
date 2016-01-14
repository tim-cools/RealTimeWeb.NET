using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;

namespace Soloco.RealTimeWeb.Membership.Messages.RefreshTokens
{
    public class RefreshTokenValidator : IMessage<Result>
    {
        public string RefreshToken { get; set; }
        public string ClientId { get; set; }
        public string UserId { get; set; }

        public RefreshTokenValidator(string refreshToken, string clientId, string userId)
        {
            RefreshToken = refreshToken;
            ClientId = clientId;
            UserId = userId;
        }
    }
}