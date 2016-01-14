using System;
using Marten;
using Shouldly;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Common.Tests.Messages;
using Soloco.RealTimeWeb.Membership.Messages.RefreshTokens;
using StructureMap;
using Xunit;

namespace Soloco.RealTimeWeb.Membership.Tests.Integration.RefreshTokens
{
    public class WhenValidatingRefreshTokenGivenTokenIsValid : ServiceTestBase<IMessageDispatcher>,
        IClassFixture<MembershipIntegrationTestFixture>
    {
        private Result _result;
        private string _refreshToken;
        private string _clientId;
        private string _userId;

        public WhenValidatingRefreshTokenGivenTokenIsValid(MembershipIntegrationTestFixture fixture)
            : base(fixture)
        {
        }

        protected override void Given(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            _refreshToken = Guid.NewGuid().ToString("n");
            _clientId = Guid.NewGuid().ToString("n");
            _userId = Guid.NewGuid().ToString("n");

            var command = new CreateRefreshTokenCommand(_refreshToken, _clientId, _userId, "me", "*", DateTimeOffset.Now,
                DateTimeOffset.Now);

            var result = dispatcher.ExecuteNowWithTimeout(command);
            result.Succeeded.ShouldBeTrue(result.ToString);
        }

        protected override void When(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            var query = new RefreshTokenValidator(_refreshToken, _clientId, _userId);
            _result = dispatcher.ExecuteNowWithTimeout(query);
        }

        [Fact]
        public void ThenTokenShouldBeValid()
        {
            _result.ShouldNotBeNull();
            _result.Succeeded.ShouldBeTrue(_result.ToString);
        }
    }

    public class WhenValidatingRefreshTokenGivenTokenDoesNotExists : ServiceTestBase<IMessageDispatcher>,
       IClassFixture<MembershipIntegrationTestFixture>
    {
        private Result _result;

        public WhenValidatingRefreshTokenGivenTokenDoesNotExists(MembershipIntegrationTestFixture fixture)
            : base(fixture)
        {
        }

        protected override void When(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            var refreshToken = Guid.NewGuid().ToString("n");
            var clientId = Guid.NewGuid().ToString("n");
            var userId = Guid.NewGuid().ToString("n");

            var query = new RefreshTokenValidator(refreshToken, clientId, userId);
            _result = dispatcher.ExecuteNowWithTimeout(query);
        }

        [Fact]
        public void ThenTokenShouldBeUnknown()
        {
            _result.ShouldNotBeNull();
            _result.Succeeded.ShouldBeFalse();
            _result.Errors.ShouldContain("Unknown refresh token");
        }
    }

    public class WhenValidatingRefreshTokenGivenTokenHasDifferntUser : ServiceTestBase<IMessageDispatcher>,
       IClassFixture<MembershipIntegrationTestFixture>
    {
        private Result _result;
        private string _refreshToken;
        private string _clientId;

        public WhenValidatingRefreshTokenGivenTokenHasDifferntUser(MembershipIntegrationTestFixture fixture)
            : base(fixture)
        {
        }

        protected override void Given(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            _refreshToken = Guid.NewGuid().ToString("n");
            _clientId = Guid.NewGuid().ToString("n");
            var userId = Guid.NewGuid().ToString("n");

            var command = new CreateRefreshTokenCommand(_refreshToken, _clientId, userId, "me", "*", DateTimeOffset.Now,
                DateTimeOffset.Now);

            var result = dispatcher.ExecuteNowWithTimeout(command);
            result.Succeeded.ShouldBeTrue(result.ToString);
        }

        protected override void When(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            var query = new RefreshTokenValidator(_refreshToken, _clientId, Guid.NewGuid().ToString("n"));
            _result = dispatcher.ExecuteNowWithTimeout(query);
        }

        [Fact]
        public void ThenTokenShouldBeInvalid()
        {
            _result.ShouldNotBeNull();
            _result.Succeeded.ShouldBeFalse();
            _result.Errors.ShouldContain("Invalid refresh token");
        }
    }

    public class WhenValidatingRefreshTokenGivenTokenHasDifferntClient : ServiceTestBase<IMessageDispatcher>,
       IClassFixture<MembershipIntegrationTestFixture>
    {
        private Result _result;
        private string _refreshToken;
        private string _userId;

        public WhenValidatingRefreshTokenGivenTokenHasDifferntClient(MembershipIntegrationTestFixture fixture)
            : base(fixture)
        {
        }

        protected override void Given(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            _refreshToken = Guid.NewGuid().ToString("n");
            _userId = Guid.NewGuid().ToString("n");
            var clientId = Guid.NewGuid().ToString("n");

            var command = new CreateRefreshTokenCommand(_refreshToken, clientId, _userId, "me", "*", DateTimeOffset.Now,
                DateTimeOffset.Now);

            var result = dispatcher.ExecuteNowWithTimeout(command);
            result.Succeeded.ShouldBeTrue(result.ToString);
        }

        protected override void When(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            var query = new RefreshTokenValidator(_refreshToken, Guid.NewGuid().ToString("n"), _userId);
            _result = dispatcher.ExecuteNowWithTimeout(query);
        }

        [Fact]
        public void ThenTokenShouldBeInvalid()
        {
            _result.ShouldNotBeNull();
            _result.Succeeded.ShouldBeFalse();
            _result.Errors.ShouldContain("Invalid refresh token");
        }
    }
}