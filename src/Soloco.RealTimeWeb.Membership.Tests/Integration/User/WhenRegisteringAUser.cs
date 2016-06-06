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

        protected override void When(TestContext<IMessageDispatcher> context)
        {
            var name = Guid.NewGuid().ToString("n");
            _command = new RegisterUserCommand(name, "eMail@future.now", TestData.GeneratePassword());

            _result = context.Service.ExecuteNowWithTimeout(_command);
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
            SessionScope((context) =>
            {
                var userByNameQuery = new UserByNameQuery(_command.UserName);
                var user = context.Service.ExecuteNowWithTimeout(userByNameQuery);

                user.ShouldNotBeNull();
            });
        }

        [Fact]
        public void ThenAUserShouldBeAbleToLogin()
        {
            SessionScope((context) =>
            {
                var validUserLoginQuery = new UserNamePasswordLogin(_command.UserName, _command.Password);
                var result = context.Service.ExecuteNowWithTimeout(validUserLoginQuery);

                result.Succeeded.ShouldBeTrue();
            });
        }

        [Fact]
        public void ThenADifferentPasswordShouldFailToLogin()
        {
            SessionScope((context) =>
            {
                var query = new UserNamePasswordLogin(_command.UserName, "wrong password");
                var result = context.Service.ExecuteNowWithTimeout(query);

                result.Succeeded.ShouldBeFalse();
            });
        }
    }
}
