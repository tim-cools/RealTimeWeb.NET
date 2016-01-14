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
    public class WhenLoginAnExternalUser : ServiceTestBase<IMessageDispatcher>, IClassFixture<MembershipIntegrationTestFixture>
    {
        private LoginResult _result;
        private string _userName;

        public WhenLoginAnExternalUser(MembershipIntegrationTestFixture fixture) : base(fixture)
        {
        }

        protected override void When(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            _userName = Guid.NewGuid().ToString("n");
            var externalIdentifier = Guid.NewGuid().ToString("n");

            var command = new ExternalLoginCommand("Facebook", _userName, externalIdentifier, _userName + "@me.com");
            _result = dispatcher.ExecuteNowWithTimeout(command);
        }

        [Fact]
        public void ThenTheLoginShouldSucceed()
        {
            _result.Succeeded.ShouldBeTrue(_result.ToString());
        }

        [Fact]
        public void ThenTheUserShouldExist()
        {
            SessionScope((dispatcher, session, container) =>
            {
                var user = session.Load<Users.Domain.User>(_result.UserId);
                user.ShouldNotBeNull();
                user.FullName.ShouldBe(_userName);
            });
        }
    }

    public class WhenLoginAnExternalUserGivenExistingExternalUser : ServiceTestBase<IMessageDispatcher>, IClassFixture<MembershipIntegrationTestFixture>
    {
        private LoginResult _result;
        private string _userName;
        private string _externalIdentifier;
        private Guid _userId;
        private ExternalLoginCommand _command;

        public WhenLoginAnExternalUserGivenExistingExternalUser(MembershipIntegrationTestFixture fixture) : base(fixture)
        {
        }

        protected override void Given(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            _userName = Guid.NewGuid().ToString("n");
            _externalIdentifier = Guid.NewGuid().ToString("n");

            _command = new ExternalLoginCommand("Facebook", _userName, _externalIdentifier, _userName + "@me.com");
            var result = dispatcher.ExecuteNowWithTimeout(_command);

            result.Succeeded.ShouldBeTrue(result.ToString);

            _userId = result.UserId;
        }

        protected override void When(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            _result = dispatcher.ExecuteNowWithTimeout(_command);
        }

        [Fact]
        public void ThenTheLoginShouldSucceed()
        {
            _result.Succeeded.ShouldBeTrue(_result.ToString);
        }

        [Fact]
        public void ThenTheSameUserShouldBeReturned()
        {
            _userId.ShouldBe(_result.UserId);
        }
    }

    public class WhenLoginAnExternalUserGivenExistingUser : ServiceTestBase<IMessageDispatcher>, IClassFixture<MembershipIntegrationTestFixture>
    {
        private LoginResult _result;
        private string _userName;
        private string _externalIdentifier;

        public WhenLoginAnExternalUserGivenExistingUser(MembershipIntegrationTestFixture fixture) : base(fixture)
        {
        }

        protected override void Given(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            _userName = Guid.NewGuid().ToString("n");
            _externalIdentifier = Guid.NewGuid().ToString("n");

            var command = new RegisterUserCommand(_userName, _userName + "@me.com", Guid.NewGuid().ToString("n"));
            var result = dispatcher.ExecuteNowWithTimeout(command);

            result.Succeeded.ShouldBeTrue(result.ToString);
        }

        protected override void When(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            var command = new ExternalLoginCommand("Facebook", "otherUserName", _externalIdentifier, _userName + "@me.com");
            _result = dispatcher.ExecuteNowWithTimeout(command);
        }

        [Fact]
        public void ThenTheLoginShouldSucceed()
        {
            _result.Succeeded.ShouldBeTrue(_result.ToString);
        }

        [Fact]
        public void ThenTheUserNameShouldBeTheOriginalUserName()
        {
            _result.UserName.ShouldBe(_userName);
        }
    }

    public class WhenLoginAnExternalUserGivenExistingExternalUserFromOtherProvider : ServiceTestBase<IMessageDispatcher>, IClassFixture<MembershipIntegrationTestFixture>
    {
        private LoginResult _result;
        private string _userName;
        private string _externalIdentifier;
        private Guid _userId;

        public WhenLoginAnExternalUserGivenExistingExternalUserFromOtherProvider(MembershipIntegrationTestFixture fixture) : base(fixture)
        {
        }

        protected override void Given(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            _userName = Guid.NewGuid().ToString("n");
            _externalIdentifier = Guid.NewGuid().ToString("n");

            var command = new ExternalLoginCommand("Facebook", _userName, _externalIdentifier, _userName + "@me.com");
            var result = dispatcher.ExecuteNowWithTimeout(command);

            result.Succeeded.ShouldBeTrue(result.ToString);

            _userId = result.UserId;
        }

        protected override void When(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            var command = new ExternalLoginCommand("Google", _userName, _externalIdentifier, _userName + "@me.com");
            _result = dispatcher.ExecuteNowWithTimeout(command);
        }

        [Fact]
        public void ThenTheLoginShouldSucceed()
        {
            _result.Succeeded.ShouldBeTrue(_result.ToString);
        }

        [Fact]
        public void ThenTheSameUserShouldBeReturned()
        {
            _userId.ShouldBe(_result.UserId);
        }
    }
}