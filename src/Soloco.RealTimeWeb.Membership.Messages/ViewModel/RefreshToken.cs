using System;

namespace Soloco.ReactiveStarterKit.Membership.Messages.ViewModel
{
    public class RefreshToken
    {
        public Guid Id { get; set; }

        public string Subject { get; set; }

        public string ClientKey { get; set; }

        public DateTimeOffset? IssuedUtc { get; set; }
        public DateTimeOffset? ExpiresUtc { get; set; }
    }
}