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

        protected override void Given(TestContext<IMessageDispatcher> context)
        {
            var command = new CreateRefreshTokenCommand(
              Guid.NewGuid().ToString(),
              Guid.NewGuid().ToString(),
              Guid.NewGuid().ToString(),
              Guid.NewGuid().ToString(),
              Guid.NewGuid().ToString(),
              DateTimeOffset.Now,
              DateTimeOffset.Now);

            var result = context.Service.ExecuteNowWithTimeout(command);
            result.Succeeded.ShouldBeTrue(result.ToString());
        }

        protected override void When(TestContext<IMessageDispatcher> context)
        {
            var query = new RefreshTokensQuery();
            _result = context.Service.ExecuteNowWithTimeout(query);
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