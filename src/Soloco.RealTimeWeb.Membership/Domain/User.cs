using System;
using Microsoft.AspNet.Identity;

namespace Soloco.ReactiveStarterKit.Membership.Domain
{
    public class User : IUser<Guid>
    {
        public Guid Id { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public bool EmailConfirmed { get; set; }
        public string PasswordHash { get; set; }
        public string SecurityStamp { get; set; }
        public string PhoneNumber { get; set; }
        public bool PhoneNumberConfirmed { get; set; }
        public bool TwoFactorEnabled { get; set; }
        public DateTime? LockoutEndDateUtc { get; set; }
        public bool LockoutEnabled { get; set; }
        public int AccessFailedCount { get; set; }

        public User(string userName)
        {
            Id = Guid.NewGuid();
            UserName = userName;
        }
    }
}