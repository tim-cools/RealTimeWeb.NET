using System;

namespace Soloco.RealTimeWeb.Membership.Messages.ViewModel
{
    public class ValidateClientAuthenticationResult
    {
        public Guid Id { get; }
        public string Name { get; }
        public bool Valid { get; }
        public string AllowedOrigin { get; }
        public string RedirectUri { get;  }

        public ValidateClientAuthenticationResult(bool valid, Guid id = default(Guid), string name = null, string allowedOrigin = null, string redirectUri = null)
        {
            Id = id;
            Name = name;
            Valid = valid;
            AllowedOrigin = allowedOrigin;
            RedirectUri = redirectUri;
        }
    }
}