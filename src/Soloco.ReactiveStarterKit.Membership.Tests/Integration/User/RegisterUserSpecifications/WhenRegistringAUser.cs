using System;
using System.Linq;
using Microsoft.AspNet.Identity;
using NUnit.Framework;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Commands;
using Soloco.ReactiveStarterKit.Membership.Client.Queries;
using Soloco.ReactiveStarterKit.Membership.Messages.Commands;

namespace Soloco.ReactiveStarterKit.Membership.Tests.Integration.User.RegisterUserSpecifications
{
    [TestFixture]
    public class WhenRegistringAUser : ServiceTestBase<IMessageDispatcher>
    {
        private IdentityResult _result;
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
