using System;
using Shouldly;
using Xunit;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Membership.Messages.Queries;

namespace Soloco.RealTimeWeb.Membership.Tests.Integration.Queries
{
    public class WhenValidatingUserLogin : ServiceTestBase<IMessageDispatcher>, IClassFixture<MembershipIntegrationTestFixture>
    {
        private bool _result;
        private ValidUserLoginQuery _query;

        public WhenValidatingUserLogin(MembershipIntegrationTestFixture fixture) : base(fixture)
        {
        }

        protected override void When()
        {
            base.When();

            var userName = Guid.NewGuid().ToString("n");
            var password = Guid.NewGuid().ToString("n");
            _query = new ValidUserLoginQuery(userName, password);

            _result = Service.ExecuteNowWithTimeout(_query);
        }

        [Fact]
        public void ThenTheRefreshTokensShouldBeReturned()
        {
            _result.ShouldBeFalse();
        }
    }
}