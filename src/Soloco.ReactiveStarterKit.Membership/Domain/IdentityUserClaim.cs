using System;

namespace Soloco.ReactiveStarterKit.Membership.Domain
{
    public class IdentityUserClaim
    {
        public virtual Guid Id { get; set; }
        public virtual string ClaimType { get; set; }
        public virtual string ClaimValue { get; set; }
    }
}