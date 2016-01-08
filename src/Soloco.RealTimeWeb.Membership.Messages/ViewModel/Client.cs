using System;

namespace Soloco.RealTimeWeb.Membership.Messages.ViewModel
{
    public class Client
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string AllowedOrigin { get; set; }
    }
}