using System;
using System.Threading.Tasks;
using Marten;
using Microsoft.AspNet.Identity;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Membership.Domain;
using Soloco.RealTimeWeb.Membership.Messages.Queries;
using Soloco.RealTimeWeb.Membership.Services;

namespace Soloco.RealTimeWeb.Membership.QueryHandlers
{
    public class ValidUserLoginQueryHandler : QueryHandler<ValidUserLoginQuery, bool>
    {
        private readonly UserManager<User, Guid> _userManager;

        public ValidUserLoginQueryHandler(IDocumentSession session, IDisposable scope)
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