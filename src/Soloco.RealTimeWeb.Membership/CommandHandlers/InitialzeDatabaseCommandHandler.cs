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
    public class InitializeDatabaseCommandHandler : CommandHandler<InitializeDatabaseCommand>
    {
        public InitializeDatabaseCommandHandler(IDocumentSession session, IDisposable scope)
             : base(session, scope)
        {
        }

        protected override async Task<CommandResult> Execute(InitializeDatabaseCommand command)
        {
            UpdateClients(Session);
            return CommandResult.Success;
        }

        private static void UpdateClients(IDocumentSession session)
        {
            var clients = Clients.Get();
            foreach (var client in clients)
            {
                EnsureClient(session, client);
            }
        }

        private static void EnsureClient(IDocumentSession session, Client client)
        {
            var existing = session.GetFirst<Client>(criteria => criteria.Key == client.Key);
            if (existing == null)
            {
                session.Store(client);
            }
            else
            {
                UpdateClient(client, existing);
                session.Store(existing);
            }
        }

        private static void UpdateClient(Client client, Client existing)
        {
            existing.Secret = client.Secret;
            existing.Name = client.Name;
            existing.ApplicationType = client.ApplicationType;
            existing.Active = client.Active;
            existing.RefreshTokenLifeTime = client.RefreshTokenLifeTime;
            existing.AllowedOrigin = client.AllowedOrigin;
        }
    }
}