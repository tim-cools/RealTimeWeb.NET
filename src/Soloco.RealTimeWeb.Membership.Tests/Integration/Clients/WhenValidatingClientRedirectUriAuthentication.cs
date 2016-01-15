using System;
using System.Net.Http;
using Marten;
using Shouldly;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Common.Tests.Messages;
using Soloco.RealTimeWeb.Membership.Messages.Clients;
using StructureMap;
using Xunit;
using Client = Soloco.RealTimeWeb.Membership.Clients.Domain.Client;

namespace Soloco.RealTimeWeb.Membership.Tests.Integration.Clients
{
    public class WhenValidatingClientRedirectUriGivenClientIsNotKnown : ServiceTestBase<IMessageDispatcher>,
        IClassFixture<MembershipIntegrationTestFixture>
    {
        private Result _result;

        public WhenValidatingClientRedirectUriGivenClientIsNotKnown(MembershipIntegrationTestFixture fixture)
            : base(fixture)
        {
        }

        protected override void When(TestContext<IMessageDispatcher> context)
        {
            var clientId = Guid.NewGuid().ToString("n");
            var redirectUri = Guid.NewGuid().ToString("n");
            var validator = new ClientRedirectUriValidator(clientId, redirectUri);

            _result = context.Service.ExecuteNowWithTimeout(validator);
        }

        [Fact]
        public void ThenClientShouldBeInalid()
        {
            _result.ShouldNotBeNull();
            _result.Succeeded.ShouldBeFalse();
        }
    }

    public class WhenValidatingClientRedirectUriGivenClientAndRedirectUriIsKnown : ServiceTestBase<IMessageDispatcher>,
        IClassFixture<MembershipIntegrationTestFixture>
    {
        private Result _result;
        private Client _client;

        public WhenValidatingClientRedirectUriGivenClientAndRedirectUriIsKnown(MembershipIntegrationTestFixture fixture)
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
            var validator = new ClientRedirectUriValidator(_client.Key, _client.RedirectUri);
            _result = context.Service.ExecuteNowWithTimeout(validator);
        }

        [Fact]
        public void ThenClientShouldBeValid()
        {
            _result.ShouldNotBeNull();
            _result.Succeeded.ShouldBeTrue(_result.ToString);
        }
    }

    public class WhenValidatingClientRedirectUriGivenRedirectUriIsInvalid : ServiceTestBase<IMessageDispatcher>,
        IClassFixture<MembershipIntegrationTestFixture>
    {
        private Client _client;
        private Result _result;

        public WhenValidatingClientRedirectUriGivenRedirectUriIsInvalid(MembershipIntegrationTestFixture fixture)
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
            var validator = new ClientRedirectUriValidator(_client.Key, _client.RedirectUri);
            _result = context.Service.ExecuteNowWithTimeout(validator);
        }

        [Fact]
        public void ThenClientShouldBeValid()
        {
            _result.ShouldNotBeNull();
            _result.Succeeded.ShouldBeTrue(_result.ToString);
        }
    }
}