using System;
using System.Linq;
using Marten;
using Shouldly;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Common.Tests.Messages;
using Soloco.RealTimeWeb.Membership.Messages.Users;
using StructureMap;
using Xunit;

namespace Soloco.RealTimeWeb.Membership.Tests.Integration.User
{
    public class WhenRegisteringAUser : ServiceTestBase<IMessageDispatcher>, IClassFixture<MembershipIntegrationTestFixture>
    {
        private Result _result;
        private RegisterUserCommand _command;

        public WhenRegisteringAUser(MembershipIntegrationTestFixture fixture) : base(fixture)
        {
        }

        protected override void When(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
        {
            var name = Guid.NewGuid().ToString("n");
            _command = new RegisterUserCommand(name, "eMail@future.now", "password");

            _result = dispatcher.ExecuteNowWithTimeout(_command);
        }

        [Fact]
        public void ThenTheResultShouldSucceed()
        {
            _result.Succeeded.ShouldBeTrue();
        }

        [Fact]
        public void ThenTheResultShouldHaveNoErrors()
        {
            if (_result.Errors.Any())
            {
                var errors = _result.Errors.Aggregate(string.Empty, (value, result) => $"{result}, {value}");
                throw new InvalidOperationException(errors);
            }
        }

        [Fact]
        public void ThenAUserShouldBeStored()
        {
            SessionScope((dispatcher, session, container) =>
            {
                var userByNameQuery = new UserByNameQuery(_command.UserName);
                var user = dispatcher.ExecuteNowWithTimeout(userByNameQuery);

                user.ShouldNotBeNull();
            });
        }

        [Fact]
        public void ThenAUserShouldBeAbleToLogin()
        {
            SessionScope((dispatcher, session, container) =>
            {
                var validUserLoginQuery = new UserNamePasswordLogin(_command.UserName, _command.Password);
                var result = dispatcher.ExecuteNowWithTimeout(validUserLoginQuery);

                result.Succeeded.ShouldBeTrue();
            });
        }

        [Fact]
        public void ThenADifferentPasswordShouldFailToLogin()
        {
            SessionScope((dispatcher, session, container) =>
            {
                var query = new UserNamePasswordLogin(_command.UserName, "wrong password");
                var result = dispatcher.ExecuteNowWithTimeout(query);

                result.Succeeded.ShouldBeFalse();
            });
        }
    }
}
