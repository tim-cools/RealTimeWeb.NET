using System;
using Marten;
using Shouldly;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Common.Tests.Messages;
using Soloco.RealTimeWeb.Membership.Messages.Clients;
using StructureMap;
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

        protected override void When(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            var clientId = Guid.NewGuid().ToString("n");
            var clientSecret = Guid.NewGuid().ToString("n");

            var query = new ClientValidator(clientId, clientSecret);
            _result = dispatcher.ExecuteNowWithTimeout(query);
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

        protected override void Given(IMessageDispatcher service, IDocumentSession session, IContainer container)
        {
            _client = ClientFactory.Create();

            session.Store(_client);
            session.SaveChanges();
        }

        protected override void When(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            var query = new ClientValidator(_client.Key, _client.Secret);
            _result = dispatcher.ExecuteNowWithTimeout(query);
        }

        [Fact]
        public void ThenClientShouldBeValid()
        {
            _result.ShouldNotBeNull();
            _result.Succeeded.ShouldBeTrue(_result.ToString);
        }
    }
}