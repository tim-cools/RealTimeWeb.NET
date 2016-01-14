using System;
using Marten;
using Shouldly;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Common.Tests.Messages;
using Soloco.RealTimeWeb.Membership.Messages.Users;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;
using StructureMap;
using Xunit;

namespace Soloco.RealTimeWeb.Membership.Tests.Integration.User
{
    public class WhenLoginAUserByUserNameAndPasswordGivenUseDoesNotExists : ServiceTestBase<IMessageDispatcher>, IClassFixture<MembershipIntegrationTestFixture>
    {
        private LoginResult _result;

        public WhenLoginAUserByUserNameAndPasswordGivenUseDoesNotExists(MembershipIntegrationTestFixture fixture) : base(fixture)
        {
        }

        protected override void When(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            var userName = Guid.NewGuid().ToString("n");
            var password = Guid.NewGuid().ToString("n");

            var command = new UserNamePasswordLogin(userName, password);
            _result = dispatcher.ExecuteNowWithTimeout(command);
        }

        [Fact]
        public void ThenTheRefreshTokensShouldBeReturned()
        {
            _result.Succeeded.ShouldBeFalse();
        }
    }
}