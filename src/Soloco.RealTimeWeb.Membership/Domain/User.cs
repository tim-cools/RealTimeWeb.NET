using System;
using System.Collections.Generic;

namespace Soloco.RealTimeWeb.Membership.Domain
{
    public class User
    {
        public Guid Id { get; set; }

        public string UserName { get; set; }
        public string NormalizedUserName { get; set; }

        public string Email { get; set; }
        public bool EmailConfirmed { get; set; }
        public string NormalizedEmail { get; set; }

        public string PasswordHash { get; set; }
        public string SecurityStamp { get; set; }
        public string PhoneNumber { get; set; }
        public bool PhoneNumberConfirmed { get; set; }
        public bool TwoFactorEnabled { get; set; }
        public DateTime? LockoutEndDateUtc { get; set; }
        public bool LockoutEnabled { get; set; }
        public int AccessFailedCount { get; set; }
        public IList<string> Roles { get; set; }

        public User()
        {
            Roles = new List<string>();
        }

        public User(string userName, string eMail)
        {
            UserName = userName;
            Email = eMail;
        }
    }
}