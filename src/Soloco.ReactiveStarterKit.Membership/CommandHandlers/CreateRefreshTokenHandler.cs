using System;
using System.Threading.Tasks;
using Marten;
using Soloco.ReactiveStarterKit.Common.Infrastructure;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Store;
using Soloco.ReactiveStarterKit.Membership.Domain;
using Soloco.ReactiveStarterKit.Membership.Messages.Commands;

namespace Soloco.ReactiveStarterKit.Membership.CommandHandlers
{
    public class CreateRefreshTokenHandler : CommandHandler<CreateRefreshTokenCommand>
    {
        public CreateRefreshTokenHandler(ITrackingSession session, IDisposable scope) : base(session, scope)
        {
        }

        protected override async Task<CommandResult> Execute(CreateRefreshTokenCommand command)
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

            return CommandResult.Success;
        }
    }
}