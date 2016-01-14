using System;
using System.Threading.Tasks;
using Marten;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Common.Security;
using Soloco.RealTimeWeb.Common.Store;
using Soloco.RealTimeWeb.Membership.Messages.RefreshTokens;
using RefreshToken = Soloco.RealTimeWeb.Membership.RefreshTokens.Domain.RefreshToken;

namespace Soloco.RealTimeWeb.Membership.RefreshTokens.Handlers
{
    public class CreateRefreshTokenHandler : CommandHandler<CreateRefreshTokenCommand>
    {
        public CreateRefreshTokenHandler(IDocumentSession session) : base(session)
        {
        }

        protected override Task<Result> Execute(CreateRefreshTokenCommand command)
        {
            var hash = Hasher.ComputeSHA256(command.RefreshToken);

            VerifyNotExisting(hash);

            var token = new RefreshToken
            {
                Id = Guid.NewGuid(),
                Hash = hash,
                ClientId = command.ClientId,
                UserId = command.UserId,
                IpAddress = command.IpAddress,
                ExpiresUtc = command.ExpiresUtc,
                IssuedUtc = command.IssuedUtc
            };

            Session.Store(token);

            return Task.FromResult(Result.Success);
        }

        private void VerifyNotExisting(string hash)
        {
            var existing = Session.GetFirst<RefreshToken>(criteria => criteria.Hash == hash);
            if (existing != null)
            {
                throw new BusinessException("Create refresh token failed", "RefreshTokenAlreadyExists");
            }
        }
    }
}