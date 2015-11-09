using System;
using System.Threading.Tasks;
using Marten;
using Microsoft.AspNet.Identity;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Membership.Domain;
using Soloco.ReactiveStarterKit.Membership.Messages.Queries;
using Soloco.ReactiveStarterKit.Membership.Services;

namespace Soloco.ReactiveStarterKit.Membership.Client.QueryHandlers
{
    public class ValidUserLoginQueryHandler : IHandleMessage<ValidUserLoginQuery, bool>
    {
        private readonly IDisposable _scope;
        private readonly UserManager<IdentityUser, Guid> _userManager;

        public ValidUserLoginQueryHandler(IDocumentSession session, IDisposable scope)
        {
            _scope = scope;
            var userStore = new UserStore(session);
            _userManager = new UserManager<IdentityUser, Guid>(userStore);
        }

        public async Task<bool> Handle(ValidUserLoginQuery query)
        {
            using (_scope)
            {
                var result = await _userManager.FindAsync(query.UserName, query.Password);

                return result != null;
            }
        }
    }
}