using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Marten;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Membership.Messages.RefreshTokens;

namespace Soloco.RealTimeWeb.Membership.RefreshTokens.Handlers
{
    public class RefreshTokensQueryHandler : QueryHandler<RefreshTokensQuery, IEnumerable<RefreshToken>>
    {

        public RefreshTokensQueryHandler(IQuerySession session)
              : base(session)
        {
        }

        protected override Task<IEnumerable<RefreshToken>> Execute(RefreshTokensQuery query)
        {
            IEnumerable<RefreshToken> tokens = Session.Query<Domain.RefreshToken>()
                .Select(token => new RefreshToken
                {
                    Id = token.Id,
                    IpAddress = token.IpAddress, 
                    ClientId = token.ClientId,
                    ExpiresUtc = token.ExpiresUtc,
                    IssuedUtc = token.IssuedUtc,
                    UserId = token.UserId
                })
                .ToArray();
            return Task.FromResult(tokens);
        }
    }
}