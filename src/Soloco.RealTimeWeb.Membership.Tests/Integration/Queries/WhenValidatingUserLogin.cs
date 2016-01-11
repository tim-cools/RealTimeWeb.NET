using System;
using Marten;
using Shouldly;
using Soloco.RealTimeWeb.Common.Messages;
using StructureMap;
using Xunit;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Common.Tests.Messages;
using Soloco.RealTimeWeb.Membership.Messages.Commands;
using Soloco.RealTimeWeb.Membership.Messages.Queries;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Membership.Tests.Integration.Queries
{
    public class WhenValidatingUserLogin : ServiceTestBase<IMessageDispatcher>, IClassFixture<MembershipIntegrationTestFixture>
    {
        private LoginResult _result;
        private UserNamePasswordLogin _query;

        public WhenValidatingUserLogin(MembershipIntegrationTestFixture fixture) : base(fixture)
        {
        }

        protected override void Given(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            var userName = Guid.NewGuid().ToString("n");
            var password = Guid.NewGuid().ToString("n");
            _query = new UserNamePasswordLogin(userName, password);

            _result = dispatcher.ExecuteNowWithTimeout(_query);
        }

        [Fact]
        public void ThenTheRefreshTokensShouldBeReturned()
        {
            _result.Succeeded.ShouldBeFalse();
        }
    }
}