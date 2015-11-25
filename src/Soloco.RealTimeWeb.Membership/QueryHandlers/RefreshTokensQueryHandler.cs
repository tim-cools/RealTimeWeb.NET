using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Marten;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Membership.Messages.Queries;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Membership.QueryHandlers
{
    public class RefreshTokensQueryHandler : QueryHandler<RefreshTokensQuery, IEnumerable<RefreshToken>>
    {

        public RefreshTokensQueryHandler(IQuerySession session, IDisposable scope)
              : base(session, scope)
        {
        }

        protected override async Task<IEnumerable<RefreshToken>> Execute(RefreshTokensQuery query)
        { 
            return Session.Query<RefreshToken>().ToArray();
        }
    }
}