using System.Collections.Generic;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Membership.Messages.Queries
{
    public class RefreshTokensQuery : IMessage<IEnumerable<RefreshToken>>
    {
    }
}