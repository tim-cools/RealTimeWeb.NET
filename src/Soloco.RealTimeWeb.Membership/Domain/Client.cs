using System;
using System.ComponentModel.DataAnnotations;

namespace Soloco.RealTimeWeb.Membership.Domain
{
    public class Client
    {
        public Guid Id { get; set; }
        public string Secret { get; set; }

        public string Name { get; set; }
        public ApplicationTypes ApplicationType { get; set; }

        public bool Active { get; set; }
        public string AllowedOrigin { get; set; }

        public string Key { get; set; }
        public string  RedirectUri { get; set; }
    }
}