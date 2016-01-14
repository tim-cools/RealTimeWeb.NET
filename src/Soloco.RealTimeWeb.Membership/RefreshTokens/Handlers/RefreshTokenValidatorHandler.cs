using System.Threading.Tasks;
using Marten;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Common.Security;
using Soloco.RealTimeWeb.Common.Store;
using Soloco.RealTimeWeb.Membership.Messages.RefreshTokens;

namespace Soloco.RealTimeWeb.Membership.RefreshTokens.Handlers
{
    public class RefreshTokenValidatorHandler : QueryHandler<RefreshTokenValidator, Result>
    {
        public RefreshTokenValidatorHandler(IQuerySession session)
              : base(session)
        {
        }

        protected override Task<Result> Execute(RefreshTokenValidator query)
        {
            var result = Validate(query);

            return Task.FromResult(result);
        }

        private Result Validate(RefreshTokenValidator query)
        {
            var hash = Hasher.ComputeSHA256(query.RefreshToken);

            var token = Session.GetFirst<Domain.RefreshToken>(criteria => criteria.Hash == hash);
            if (token == null)
            {
                return Result.Failed("Unknown refresh token");
            }

            if (token.UserId != query.UserId || token.ClientId != query.ClientId)
            {
                return Result.Failed("Invalid refresh token");
            }

            return Result.Success;
        }
    }
}