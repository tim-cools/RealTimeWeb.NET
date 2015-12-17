using System;
using System.Threading.Tasks;
using Marten;
using Microsoft.AspNet.Identity;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Membership.Domain;
using Soloco.RealTimeWeb.Membership.Messages.Queries;
using Soloco.RealTimeWeb.Membership.Services;

namespace Soloco.RealTimeWeb.Membership.QueryHandlers
{
    public class ValidUserLoginQueryHandler : QueryHandler<ValidUserLoginQuery, bool>
    {
        private readonly UserManager<User> _userManager;

        public ValidUserLoginQueryHandler(UserManager<User> userManager, IDocumentSession session)
              : base(session)
        {
            _userManager = userManager;
        }

        protected override async Task<bool> Execute(ValidUserLoginQuery query)
        {
            var user = await _userManager.FindByNameAsync(query.UserName);
            return await _userManager.CheckPasswordAsync(user, query.Password);
        }
    }
}