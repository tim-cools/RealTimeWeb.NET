using System.Collections.Generic;
using Soloco.RealTimeWeb.Common.Messages;

namespace Soloco.RealTimeWeb.Membership.Messages.RefreshTokens
{
    public class RefreshTokensQuery : IMessage<IEnumerable<RefreshToken>>
    {
    }
}