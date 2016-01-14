using System.Linq;
using Marten;
using Shouldly;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Common.Tests.Messages;
using Soloco.RealTimeWeb.Membership.Clients.Domain;
using Soloco.RealTimeWeb.Membership.Messages.Infrastructure;
using StructureMap;
using Xunit;

namespace Soloco.RealTimeWeb.Membership.Tests.Integration.Infrastructure
{
    public class WhenInitializingTheDatabase : ServiceTestBase<IMessageDispatcher>, IClassFixture<MembershipIntegrationTestFixture>
    {
        private Result _result;
        private InitializeDatabaseCommand _command;

        public WhenInitializingTheDatabase(MembershipIntegrationTestFixture fixture) : base(fixture)
        {
        }

        protected override void When(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            _command = new InitializeDatabaseCommand();
            _result = dispatcher.ExecuteNowWithTimeout(_command);
        }

        [Fact]
        public void ThenTheRefreshTokensShouldBeReturned()
        {
            _result.ShouldNotBeNull();
            _result.Succeeded.ShouldBeTrue();
        }

        [Fact]
        public void ThenClientSHouldBeCreated()
        {
            SessionScope((dispatcher, session, container) =>
            {
                session.Query<Client>().Count().ShouldBeGreaterThan(0);
            });
        }

        [Fact]
        public void ThenUsersShouldBeCreated()
        {
            SessionScope((dispatcher, session, container) =>
            {
                session.Query<Users.Domain.User>().Count().ShouldBeGreaterThan(0);
            });
        }
    }
}