using System;
using System.Threading.Tasks;
using Marten;
using Soloco.RealTimeWeb.Common.Infrastructure;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Common.Infrastructure.Store;
using Soloco.RealTimeWeb.Membership.Domain;
using Soloco.RealTimeWeb.Membership.Messages.Commands;

namespace Soloco.RealTimeWeb.Membership.CommandHandlers
{
    public class CreateRefreshTokenHandler : CommandHandler<CreateRefreshTokenCommand>
    {
        public CreateRefreshTokenHandler(IDocumentSession session, IDisposable scope) : base(session, scope)
        {
        }

        protected override Task<CommandResult> Execute(CreateRefreshTokenCommand command)
        {
            var existing = Session.GetFirst<RefreshToken>(criteria => criteria.Subject == command.Name && criteria.ClientKey == command.Clientid);

            if (existing != null)
            {
                existing.Hash = Helper.GetHash(command.RefreshTokenId);
                existing.ClientKey = command.Clientid;
                existing.Subject = command.Name;
                existing.IssuedUtc = command.IssuedUtc;
                existing.ExpiresUtc = command.ExpiresUtc;

                Session.Store(existing);
            }
            else
            {
                var token = new RefreshToken
                {
                    Id = Guid.NewGuid(),
                    Hash = Helper.GetHash(command.RefreshTokenId),
                    ClientKey = command.Clientid,
                    Subject = command.Name,
                    IssuedUtc = command.IssuedUtc,
                    ExpiresUtc = command.ExpiresUtc
                };
                Session.Store(token);
            }

            return Task.FromResult(CommandResult.Success);
        }
    }
}