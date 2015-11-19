using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Marten;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Membership.Messages.Queries;
using Soloco.ReactiveStarterKit.Membership.Messages.ViewModel;

namespace Soloco.ReactiveStarterKit.Membership.QueryHandlers
{
    public class RefreshTokensQueryHandler : IHandleMessage<RefreshTokensQuery, IEnumerable<RefreshToken>>
    {
        private readonly IDocumentSession _session;
        private readonly IDisposable _scope;

        public RefreshTokensQueryHandler(IDocumentSession session, IDisposable scope)
        {
            _session = session;
            _scope = scope;
        }

        public async Task<IEnumerable<RefreshToken>> Handle(RefreshTokensQuery query)
        {
            using (_scope)
            {
                return _session.Query<RefreshToken>().ToArray();
            }
        }
    }
}