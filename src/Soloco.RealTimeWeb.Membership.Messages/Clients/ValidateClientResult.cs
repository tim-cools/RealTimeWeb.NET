using System;
using Soloco.RealTimeWeb.Common;

namespace Soloco.RealTimeWeb.Membership.Messages.Clients
{
    public class ValidateClientResult : Result
    {
        public Guid Id { get; }
        public string Name { get; }
        public string AllowedOrigin { get; }
        public string RedirectUri { get;  }

        private ValidateClientResult(string [] errors)
            : base(errors)
        {
        }

        public ValidateClientResult(bool succeeded, Guid id = default(Guid), string name = null, string allowedOrigin = null, string redirectUri = null)
            : base(succeeded)
        {
            Id = id;
            Name = name;
            AllowedOrigin = allowedOrigin;
            RedirectUri = redirectUri;
        }

        public new static ValidateClientResult Failed(params string[] errors)
        {
            return new ValidateClientResult(errors);
        }
    }
}