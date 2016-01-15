using System;
using Shouldly;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Common.Tests.Messages;
using Soloco.RealTimeWeb.Membership.Messages.Clients;
using Xunit;
using Client = Soloco.RealTimeWeb.Membership.Clients.Domain.Client;

namespace Soloco.RealTimeWeb.Membership.Tests.Integration.Clients
{
    public class WhenValidatingClientGivenClientIsNotKnown : ServiceTestBase<IMessageDispatcher>,
        IClassFixture<MembershipIntegrationTestFixture>
    {
        private ValidateClientResult _result;

        public WhenValidatingClientGivenClientIsNotKnown(MembershipIntegrationTestFixture fixture)
            : base(fixture)
        {
        }

        protected override void When(TestContext<IMessageDispatcher> context)
        {
            var clientId = Guid.NewGuid().ToString("n");
            var clientSecret = Guid.NewGuid().ToString("n");

            var query = new ClientValidator(clientId, clientSecret);
            _result = context.Service.ExecuteNowWithTimeout(query);
        }

        [Fact]
        public void ThenClientShouldBeInalid()
        {
            _result.ShouldNotBeNull();
            _result.Succeeded.ShouldBeFalse();
        }
    }

    public class WhenValidatingClientGivenClientIsKnown : ServiceTestBase<IMessageDispatcher>,
        IClassFixture<MembershipIntegrationTestFixture>
    {
        private ValidateClientResult _result;
        private Client _client;

        public WhenValidatingClientGivenClientIsKnown(MembershipIntegrationTestFixture fixture)
            : base(fixture)
        {
        }

        protected override void Given(TestContext<IMessageDispatcher> context)
        {
            _client = ClientFactory.Create();

            context.Session.Store(_client);
            context.Session.SaveChanges();
        }

        protected override void When(TestContext<IMessageDispatcher> context)
        {
            var query = new ClientValidator(_client.Key, _client.Secret);
            _result = context.Service.ExecuteNowWithTimeout(query);
        }

        [Fact]
        public void ThenClientShouldBeValid()
        {
            _result.ShouldNotBeNull();
            _result.Succeeded.ShouldBeTrue(_result.ToString);
        }
    }
}