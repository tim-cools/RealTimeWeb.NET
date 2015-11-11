using System.Collections.Generic;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Membership.Messages.ViewModel;

namespace Soloco.ReactiveStarterKit.Membership.Messages.Queries
{
    public class RefreshTokensQuery : IMessage<IEnumerable<RefreshToken>>
    {
    }
}