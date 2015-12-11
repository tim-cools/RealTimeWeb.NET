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

        protected override Task<IEnumerable<RefreshToken>> Execute(RefreshTokensQuery query)
        {
            IEnumerable<RefreshToken> tokens = Session.Query<Domain.RefreshToken>()
                .Select(token => new RefreshToken
                {
                    ClientKey = token.ClientKey,
                    ExpiresUtc = token.ExpiresUtc,
                    Id = token.Id,
                    IssuedUtc = token.IssuedUtc,
                    Subject = token.Subject
                })
                .ToArray();
            return Task.FromResult(tokens);
        }
    }
}