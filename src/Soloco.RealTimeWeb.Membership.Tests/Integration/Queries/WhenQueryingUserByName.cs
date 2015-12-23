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

namespace Soloco.RealTimeWeb.Membership.Tests.Integration.Queries
{
    public class WhenQueryingUserByName : ServiceTestBase<IMessageDispatcher>, IClassFixture<MembershipIntegrationTestFixture>
    {
        private Messages.ViewModel.User _result;
        private UserByNameQuery _query;
        private string _userName;

        public WhenQueryingUserByName(MembershipIntegrationTestFixture fixture) : base(fixture)
        {
        }

        protected override void Given(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            _userName = Guid.NewGuid().ToString("n");
            var command = new RegisterUserCommand(
                _userName,
                "tim@future.now",
                Guid.NewGuid().ToString("n")
                );

            dispatcher.Execute(command);
       
            _query = new UserByNameQuery(_userName);

            _result = dispatcher.ExecuteNowWithTimeout(_query);
        }

        [Fact]
        public void ThenTheRefreshTokensShouldBeReturned()
        {
            _result.ShouldNotBeNull();
        }
    }
}