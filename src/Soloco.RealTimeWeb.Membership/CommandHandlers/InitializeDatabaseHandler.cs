using System;
using System.Threading.Tasks;
using Marten;
using Microsoft.AspNet.Identity;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Common.Store;
using Soloco.RealTimeWeb.Membership.Domain;
using Soloco.RealTimeWeb.Membership.Messages.Commands;

namespace Soloco.RealTimeWeb.Membership.CommandHandlers
{
    public class InitializeDatabaseHandler : CommandHandler<InitializeDatabaseCommand>
    {
        private readonly UserManager<User> _userManager;

        public InitializeDatabaseHandler(IDocumentSession session, UserManager<User> userManager)
            : base(session)
        {
            _userManager = userManager;
        }

        protected override async Task<CommandResult> Execute(InitializeDatabaseCommand command)
        {
            UpdateClients();

            await InitializeUsers();

            return CommandResult.Success;
        }

        private async Task InitializeUsers()
        {
            if (await _userManager.FindByEmailAsync("tim@soloco.be") == null)
            {
                var user = new User("123456", "123 456", "tim@soloco.be");
                await _userManager.CreateAsync(user, "Aa-123456");
            }
        }

        private void UpdateClients()
        {
            var clients = Clients.Get();
            foreach (var client in clients)
            {
                EnsureClient(client);
            }
        }

        private void EnsureClient(Client client)
        {
            var existing = Session.GetFirst<Client>(criteria => criteria.Key == client.Key);
            if (existing == null)
            {
                Session.Store(client);
            }
            else
            {
                UpdateClient(client, existing);
                Session.Store(existing);
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