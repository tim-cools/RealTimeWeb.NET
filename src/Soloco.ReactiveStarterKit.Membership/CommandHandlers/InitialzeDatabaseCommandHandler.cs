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
    public class InitializeDatabaseCommandHandler : CommandHandler<InitializeDatabaseCommand>
    {
        public InitializeDatabaseCommandHandler(ITrackingSession session, IDisposable scope)
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