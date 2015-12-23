using System;
using Marten;
using Shouldly;
using Soloco.RealTimeWeb.Common.Messages;
using StructureMap;
using Xunit;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Common.Tests.Messages;
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

        protected override void Given(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            var userName = Guid.NewGuid().ToString("n");
            var password = Guid.NewGuid().ToString("n");
            _query = new ValidUserLoginQuery(userName, password);

            _result = dispatcher.ExecuteNowWithTimeout(_query);
        }

        [Fact]
        public void ThenTheRefreshTokensShouldBeReturned()
        {
            _result.ShouldBeFalse();
        }
    }
}