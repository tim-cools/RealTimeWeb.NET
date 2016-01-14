using System;

namespace Soloco.RealTimeWeb.Membership.Messages.Users
{
    public class User
    {
        public Guid Id { get; set; }
        public string UserName { get; set; }
        public string Name { get; set; }
        public string EMail { get; set; }
    }
}