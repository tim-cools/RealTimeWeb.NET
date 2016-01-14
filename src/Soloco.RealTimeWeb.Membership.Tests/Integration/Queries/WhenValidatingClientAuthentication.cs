using System;
using System.Linq;
using Marten;
using Shouldly;
using Soloco.RealTimeWeb.Common.Messages;
using StructureMap;
using Xunit;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Common.Tests.Messages;
using Soloco.RealTimeWeb.Membership.Domain;
using Soloco.RealTimeWeb.Membership.Messages.Commands;
using Soloco.RealTimeWeb.Membership.Messages.Queries;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;
using Client = Soloco.RealTimeWeb.Membership.Domain.Client;

namespace Soloco.RealTimeWeb.Membership.Tests.Integration.Queries
{
    public class WhenValidatingClientAuthenticationGivenClientIsNotKnown : ServiceTestBase<IMessageDispatcher>,
        IClassFixture<MembershipIntegrationTestFixture>
    {
        private ValidateClientAuthenticationResult _result;
        private ClientApplicationValidator _query;

        public WhenValidatingClientAuthenticationGivenClientIsNotKnown(MembershipIntegrationTestFixture fixture)
            : base(fixture)
        {
        }

        protected override void Given(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            var clientId = Guid.NewGuid().ToString("n");
            var clientSecret = Guid.NewGuid().ToString("n");
            _query = new ClientApplicationValidator(clientId, clientSecret);

            _result = dispatcher.ExecuteNowWithTimeout(_query);
        }

        [Fact]
        public void ThenClientShouldBeInalid()
        {
            _result.ShouldNotBeNull();
            _result.Valid.ShouldBeFalse();
        }
    }

    public class WhenValidatingClientAuthenticationGivenClientIsKnown : ServiceTestBase<IMessageDispatcher>,
        IClassFixture<MembershipIntegrationTestFixture>
    {
        private ValidateClientAuthenticationResult _result;
        private ClientApplicationValidator _query;

        public WhenValidatingClientAuthenticationGivenClientIsKnown(MembershipIntegrationTestFixture fixture)
            : base(fixture)
        {
        }

        protected override void Given(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            dispatcher.Execute(new InitializeDatabaseCommand());

            var client = session.Query<Client>().FirstOrDefault();
            client.ShouldNotBeNull();;

            _query = new ClientApplicationValidator(client.Key, client.Secret);
            _result = dispatcher.ExecuteNowWithTimeout(_query);
        }

        [Fact]
        public void ThenClientShouldBeValid()
        {
            _result.ShouldNotBeNull();
            _result.Valid.ShouldBeTrue();
        }
    }
}