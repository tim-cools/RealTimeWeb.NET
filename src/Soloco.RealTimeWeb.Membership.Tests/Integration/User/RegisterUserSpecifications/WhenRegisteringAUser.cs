using System;
using System.Linq;
using NUnit.Framework;
using Soloco.RealTimeWeb.Common.Infrastructure;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Membership.Messages.Commands;
using Soloco.RealTimeWeb.Membership.Messages.Queries;

namespace Soloco.RealTimeWeb.Membership.Tests.Integration.User.RegisterUserSpecifications
{
    [TestFixture]
    public class WhenRegisteringAUser : ServiceTestBase<IMessageDispatcher>
    {
        private CommandResult _result;
        private RegisterUserCommand _command;

        protected override void When()
        {
            base.When();

            var name = Guid.NewGuid().ToString("n");
            _command  = new RegisterUserCommand(name, "password");

            _result = Service.ExecuteNowWithTimeout(_command);
        }

        [Test]
        public void ThenTheResultShouldSucceed()
        {
            Assert.That(_result.Succeeded, Is.True);
        }

        [Test]
        public void ThenTheResultShouldHaveNoErrors()
        {
            if (_result.Errors.Any())
            {
                var errors = _result.Errors.Aggregate(string.Empty, (value, result) => $"{result}, {value}");
                throw new AssertionException(errors);
            }
        }

        [Test]
        public void ThenAUserShouldBeStored()
        {
            var userByNameQuery = new UserByNameQuery(_command.UserName);
            var user = Service.ExecuteNowWithTimeout(userByNameQuery);

            Assert.IsNotNull(user);
        }

        [Test]
        public void ThenAUserShouldBeAbleToLogin()
        {
            var validUserLoginQuery = new ValidUserLoginQuery(_command.UserName, _command.Password);
            var valid = Service.ExecuteNowWithTimeout(validUserLoginQuery);

            Assert.That(valid, Is.True);
        }

        [Test]
        public void ThenADifferentPasswordShouldFailToLogin()
        {
            var query = new ValidUserLoginQuery(_command.UserName, "wrong password");
            var valid = Service.ExecuteNowWithTimeout(query);

            Assert.That(valid, Is.False);
        }
    }
}
