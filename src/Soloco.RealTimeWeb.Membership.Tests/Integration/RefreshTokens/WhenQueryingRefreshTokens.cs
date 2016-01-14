using System;
using System.Collections.Generic;
using System.Linq;
using Marten;
using Shouldly;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Common.Tests.Messages;
using Soloco.RealTimeWeb.Membership.Messages.RefreshTokens;
using StructureMap;
using Xunit;

namespace Soloco.RealTimeWeb.Membership.Tests.Integration.RefreshTokens
{
    public class WhenQueryingRefreshTokens : ServiceTestBase<IMessageDispatcher>, IClassFixture<MembershipIntegrationTestFixture>
    {
        private IEnumerable<RefreshToken> _result;

        public WhenQueryingRefreshTokens(MembershipIntegrationTestFixture fixture) : base(fixture)
        {
        }

        protected override void Given(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            var command = new CreateRefreshTokenCommand(
              Guid.NewGuid().ToString(),
              Guid.NewGuid().ToString(),
              Guid.NewGuid().ToString(),
              Guid.NewGuid().ToString(),
              Guid.NewGuid().ToString(),
              DateTimeOffset.Now,
              DateTimeOffset.Now);

            var result = dispatcher.ExecuteNowWithTimeout(command);
            result.Succeeded.ShouldBeTrue(result.ToString());
        }

        protected override void When(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            var query = new RefreshTokensQuery();
            _result = dispatcher.ExecuteNowWithTimeout(query);
        }

        [Fact]
        public void ThenTheRefreshTokensShouldBeReturned()
        {
            _result.ShouldNotBeNull();
        }

        [Fact]
        public void ThenAsLeastOnRefreshTokenShouldBeReturned()
        {
            _result.Count().ShouldBeGreaterThanOrEqualTo(1);
        }
    }
}