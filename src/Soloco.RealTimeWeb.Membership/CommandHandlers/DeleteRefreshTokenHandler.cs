using System;
using System.Threading.Tasks;
using Marten;
using Soloco.RealTimeWeb.Common.Infrastructure;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Membership.Domain;
using Soloco.RealTimeWeb.Membership.Messages.Commands;

namespace Soloco.RealTimeWeb.Membership.CommandHandlers
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