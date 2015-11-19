using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Marten;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Membership.Messages.Queries;
using Soloco.ReactiveStarterKit.Membership.Messages.ViewModel;

namespace Soloco.ReactiveStarterKit.Membership.QueryHandlers
{
    public class RefreshTokensQueryHandler : QueryHandler<RefreshTokensQuery, IEnumerable<RefreshToken>>
    {

        public RefreshTokensQueryHandler(ISession session, IDisposable scope)
              : base(session, scope)
        {
        }

        protected override async Task<IEnumerable<RefreshToken>> Execute(RefreshTokensQuery query)
        { 
            return Session.Query<RefreshToken>().ToArray();
        }
    }
}