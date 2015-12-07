using System;
using Xunit;
using Shouldly;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Membership.Messages.Queries;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;
using Soloco.RealTimeWeb.Membership.Tests.Integration.Infrastructure;

namespace Soloco.RealTimeWeb.Membership.Tests.Integration.Queries
{
    public class WhenVerifyingExternalUser : ServiceTestBase<IMessageDispatcher>, IClassFixture<MembershipIntegrationTestFixture>
    {
        private VerifyExternalUserResult _result;
        private VerifyExternalUserQuery _query;

        public WhenVerifyingExternalUser(MembershipIntegrationTestFixture fixture) : base(fixture)
        {
        }

        protected override void When()
        {
            base.When();

            _query = new VerifyExternalUserQuery(LoginProvider.Facebook, ExternalAccessTokens.Facebook);

            _result = Service.ExecuteNowWithTimeout(_query);
        }

        [Fact]
        public void ThenTheRefreshTokensShouldBeReturned()
        {
            _result.ShouldNotBeNull();
        }
    }
}