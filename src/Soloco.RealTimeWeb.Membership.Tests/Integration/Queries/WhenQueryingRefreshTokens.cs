using System;
using System.Collections.Generic;
using System.Linq;
using Xunit;
using Shouldly;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Membership.Messages.Commands;
using Soloco.RealTimeWeb.Membership.Messages.Queries;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Membership.Tests.Integration.Queries
{
    public class WhenQueryingRefreshTokens : ServiceTestBase<IMessageDispatcher>, IClassFixture<MembershipIntegrationTestFixture>
    {
        private IEnumerable<RefreshToken> _result;
        private RefreshTokensQuery _query;

        public WhenQueryingRefreshTokens(MembershipIntegrationTestFixture fixture) : base(fixture)
        {
        }

        protected override void Given()
        {
            base.Given();

            var command = new CreateRefreshTokenCommand(
                Guid.NewGuid().ToString(),
                Guid.NewGuid().ToString(),
                Guid.NewGuid().ToString(),
                Guid.NewGuid().ToString(),
                DateTimeOffset.Now, 
                DateTimeOffset.Now);

            Service.ExecuteNowWithTimeout(command).Succeeded.ShouldBeTrue();
        }

        protected override void When()
        {
            base.When();

            _query = new RefreshTokensQuery();
            _result = Service.ExecuteNowWithTimeout(_query);
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