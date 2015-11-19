using System;
using System.Threading.Tasks;
using Marten;
using Microsoft.AspNet.Identity;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Membership.Domain;
using Soloco.ReactiveStarterKit.Membership.Messages.Queries;
using Soloco.ReactiveStarterKit.Membership.Services;

namespace Soloco.ReactiveStarterKit.Membership.QueryHandlers
{
    public class ValidUserLoginQueryHandler : QueryHandler<ValidUserLoginQuery, bool>
    {
        private readonly UserManager<User, Guid> _userManager;

        public ValidUserLoginQueryHandler(ISession session, IDisposable scope)
              : base(session, scope)
        {
            var userStore = new UserStore(session);
            _userManager = new UserManager<User, Guid>(userStore);
        }

        protected override async Task<bool> Execute(ValidUserLoginQuery query)
        {
            var result = await _userManager.FindAsync(query.UserName, query.Password);

            return result != null;
        }
    }
}