using System;
using System.Linq;
using Marten;
using Shouldly;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;
using Xunit;
using StructureMap;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Common.Tests.Messages;
using Soloco.RealTimeWeb.Membership.Messages.Commands;
using Soloco.RealTimeWeb.Membership.Messages.Queries;

namespace Soloco.RealTimeWeb.Membership.Tests.Integration.User.RegisterUserSpecifications
{
    public class WhenRegisteringAUser : ServiceTestBase<IMessageDispatcher>, IClassFixture<MembershipIntegrationTestFixture>
    {
        private CommandResult _result;
        private RegisterUserCommand _command;

        public WhenRegisteringAUser(MembershipIntegrationTestFixture fixture) : base(fixture)
        {
        }

        protected override void Given(IMessageDispatcher dispatcher, IDocumentSession session, IContainer container)
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
                var validUserLoginQuery = new ValidUserLoginQuery(_command.UserName, _command.Password);
                var valid = dispatcher.ExecuteNowWithTimeout(validUserLoginQuery);

                valid.ShouldBeTrue();
            });
        }

        [Fact]
        public void ThenADifferentPasswordShouldFailToLogin()
        {
            SessionScope((dispatcher, session, container) =>
            {
                var query = new ValidUserLoginQuery(_command.UserName, "wrong password");
                var valid = dispatcher.ExecuteNowWithTimeout(query);

                valid.ShouldBeFalse();
            });
        }
    }
}
