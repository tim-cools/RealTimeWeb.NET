using System;
using System.Linq;
using Shouldly;
using Xunit;
using Soloco.RealTimeWeb.Common.Infrastructure;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Common.Tests;
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

        protected override void When()
        {
            base.When();

            var name = Guid.NewGuid().ToString("n");
            _command  = new RegisterUserCommand(name, "password");

            _result = Service.ExecuteNowWithTimeout(_command);
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
            var userByNameQuery = new UserByNameQuery(_command.UserName);
            var user = Service.ExecuteNowWithTimeout(userByNameQuery);

            user.ShouldNotBeNull();
        }

        [Fact]
        public void ThenAUserShouldBeAbleToLogin()
        {
            var validUserLoginQuery = new ValidUserLoginQuery(_command.UserName, _command.Password);
            var valid = Service.ExecuteNowWithTimeout(validUserLoginQuery);

            valid.ShouldBeTrue();
        }

        [Fact]
        public void ThenADifferentPasswordShouldFailToLogin()
        {
            var query = new ValidUserLoginQuery(_command.UserName, "wrong password");
            var valid = Service.ExecuteNowWithTimeout(query);

            valid.ShouldBeFalse();
        }
    }
}
