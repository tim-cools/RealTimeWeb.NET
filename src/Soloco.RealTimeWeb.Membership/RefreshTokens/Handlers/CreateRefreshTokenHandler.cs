using System;
using System.Threading.Tasks;
using Marten;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Membership.Messages.RefreshTokens;
using RefreshToken = Soloco.RealTimeWeb.Membership.RefreshTokens.Domain.RefreshToken;

namespace Soloco.RealTimeWeb.Membership.RefreshTokens.Handlers
{
    public class CreateRefreshTokenHandler : CommandHandler<CreateRefreshTokenCommand>
    {
        public CreateRefreshTokenHandler(IDocumentSession session) : base(session)
        {
        }

        protected override async Task<Result> Execute(CreateRefreshTokenCommand command)
        {
            await VerifyNotExisting(command.TicketId);

            var token = new RefreshToken
            {
                Id = Guid.NewGuid(),
                TicketId = command.TicketId,
                ClientId = command.ClientId,
                UserId = command.UserId,
                IpAddress = command.IpAddress,
                ExpiresUtc = command.ExpiresUtc,
                IssuedUtc = command.IssuedUtc
            };

            Session.Store(token);

            return Result.Success;
        }

        private async Task VerifyNotExisting(string ticketId)
        {
            var existing = await Session.Query<RefreshToken>().FirstOrDefaultAsync(criteria => criteria.TicketId == ticketId);
            if (existing != null)
            {
                throw new BusinessException("Create refresh token failed", "RefreshTokenAlreadyExists");
            }
        }
    }
}