using System;

namespace Soloco.ReactiveStarterKit.Membership.Domain
{
    public class UserLogin
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }
        public string LoginProvider { get; set; }
        public string ProviderKey { get; set; }
    }
}