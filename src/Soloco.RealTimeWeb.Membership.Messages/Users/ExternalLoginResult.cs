using System;
using Soloco.RealTimeWeb.Common;

namespace Soloco.RealTimeWeb.Membership.Messages.ViewModel
{
    public class LoginResult : Result
    {
        public Guid UserId { get; }
        public string UserName { get; }

        public LoginResult()
        {
        }

        public LoginResult(bool success, Guid userId = default(Guid), string userName = null) : base(success)
        {
            UserId = userId;
            UserName = userName;
        }
    }
}
