using System;
using Marten;
using Xunit;
using Shouldly;
using Soloco.RealTimeWeb.Common.Messages;
using StructureMap;
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

        protected override void Given(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            _query = new VerifyExternalUserQuery(LoginProvider.Facebook, ExternalAccessTokens.Facebook);

            _result = dispatcher.ExecuteNowWithTimeout(_query);
        }

        [Fact(Skip = "Disable usage of external api")]
        public void ThenTheRefreshTokensShouldBeReturned()
        {
            _result.ShouldNotBeNull();
        }
    }
}