using System;
using System.Threading.Tasks;
using Marten;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Common.Security;
using Soloco.RealTimeWeb.Common.Store;
using Soloco.RealTimeWeb.Membership.Domain;
using Soloco.RealTimeWeb.Membership.Messages.Commands;

namespace Soloco.RealTimeWeb.Membership.CommandHandlers
{
    public class CreateRefreshTokenHandler : CommandHandler<CreateRefreshTokenCommand>
    {
        public CreateRefreshTokenHandler(IDocumentSession session) : base(session)
        {
        }

        protected override Task<CommandResult> Execute(CreateRefreshTokenCommand command)
        {
            var existing = Session.GetFirst<RefreshToken>(criteria => criteria.Subject == command.Name && criteria.ClientKey == command.Clientid);

            if (existing != null)
            {
                existing.Hash = Hasher.ComputeSHA256(command.RefreshTokenId);
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
                    Hash = Hasher.ComputeSHA256(command.RefreshTokenId),
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