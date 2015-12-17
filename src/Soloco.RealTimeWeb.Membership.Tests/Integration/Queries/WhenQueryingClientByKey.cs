using System;
using Marten;
using Xunit;
using Shouldly;
using Soloco.RealTimeWeb.Common.Messages;
using StructureMap;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Membership.Messages.Queries;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Membership.Tests.Integration.Queries
{
    public class WhenQueryingClientByKey : ServiceTestBase<IMessageDispatcher>, IClassFixture<MembershipIntegrationTestFixture>
    {
        private Client _result;
        private ClientByKeyQuery _query;
        private Domain.Client _client;

        public WhenQueryingClientByKey(MembershipIntegrationTestFixture fixture) : base(fixture)
        {
        }

        protected override void Given(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            _client = new Domain.Client();
            _client.Id = Guid.NewGuid();
            _client.Key = Guid.NewGuid().ToString("n");
            _client.AllowedOrigin = Guid.NewGuid().ToString("n");

            session.Store(_client);
            session.SaveChanges();

            _query = new ClientByKeyQuery(_client.Key);

            _result = dispatcher.ExecuteNowWithTimeout(_query);
        }

        [Fact]
        public void ThenTheClientShouldBeReturned()
        {
            _result.ShouldNotBeNull();
        }

        [Fact]
        public void ThenTheAllowedOriginShouldBeReturned()
        {
            _result.AllowedOrigin.ShouldBe(_client.AllowedOrigin);
        }
    }
}