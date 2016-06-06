using System;
using Marten;
using Shouldly;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Common.Tests.Messages;
using Soloco.RealTimeWeb.Membership.Messages.Users;
using StructureMap;
using Xunit;

namespace Soloco.RealTimeWeb.Membership.Tests.Integration.User
{
    public class WhenQueryingUserByName : ServiceTestBase<IMessageDispatcher>, IClassFixture<MembershipIntegrationTestFixture>
    {
        private Messages.Users.User _result;
        private UserByNameQuery _query;
        private string _userName;

        public WhenQueryingUserByName(MembershipIntegrationTestFixture fixture) : base(fixture)
        {
        }

        protected override void When(TestContext<IMessageDispatcher> context)
        {
            _userName = Guid.NewGuid().ToString("n");
            var command = new RegisterUserCommand(
                _userName,
                "tim@future.now",
                TestData.GeneratePassword()
                );

            context.Service.Execute(command);
       
            _query = new UserByNameQuery(_userName);

            _result = context.Service.ExecuteNowWithTimeout(_query);
        }

        [Fact]
        public void ThenTheRefreshTokensShouldBeReturned()
        {
            _result.ShouldNotBeNull();
        }
    }
}