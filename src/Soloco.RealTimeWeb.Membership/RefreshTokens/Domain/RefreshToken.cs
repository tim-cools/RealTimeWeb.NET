using System;

namespace Soloco.RealTimeWeb.Membership.RefreshTokens.Domain
{
    public class RefreshToken
    {
        public Guid Id { get; set; }

        public string ClientId { get; set; }
        public string UserId { get; set; }
        public string IpAddress { get; set; }

        public DateTimeOffset? ExpiresUtc { get; set; }
        public DateTimeOffset? IssuedUtc { get; set; }

        public string Hash { get; set; }
    }
}