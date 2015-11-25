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
    public class DeleteRefreshTokenHandler : CommandHandler<DeleteRefreshTokenCommand>
    {
        public DeleteRefreshTokenHandler(IDocumentSession session, IDisposable scope) : base(session, scope)
        {
        }

        protected override async Task<CommandResult> Execute(DeleteRefreshTokenCommand command)
        {
            var token = Session.Load<RefreshToken>(command.TokenId);
            if (token == null)
            {
                return CommandResult.Failed("Could not find token");
            }

            Session.Delete(token);
            return CommandResult.Success;
        }
    }
}