using System;
using System.Linq;
using NUnit.Framework;
using Soloco.RealTimeWeb.Common.Infrastructure;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Membership.Messages.Commands;
using Soloco.RealTimeWeb.Membership.Messages.Queries;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;
using Soloco.RealTimeWeb.Membership.Tests.Integration.Infrastructure;

namespace Soloco.RealTimeWeb.Membership.Tests.Integration.User.RegisterExternalUserSpecifications
{
    [TestFixture]
    public class WhenRegisteringAGoogleUser : ServiceTestBase<IMessageDispatcher>
    {
        private CommandResult _result;
        private RegisterExternalUserCommand _command;
        private string _name;

        protected override void When()
        {
            base.When();

            _name = Guid.NewGuid().ToString("n");
            _command = new RegisterExternalUserCommand(_name, LoginProvider.Google, ExternalAccessTokens.Google);

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

        //[Test]
        //public void ThenAUserShouldBeStored()
        //{
        //    var userByNameQuery = new UserByNameQuery(_command.UserName);
        //    var user = Service.ExecuteNowWithTimeout(userByNameQuery);

        //    Assert.IsNotNull(user);
        //}

        [Test]
        public void ThenAUserShouldBeAbleToLogin()
        {
            var query = new VerifyExternalUserQuery(LoginProvider.Google, ExternalAccessTokens.Google);
            var result = Service.ExecuteNowWithTimeout(query);

            Assert.That(result.Registered, Is.True);
            Assert.That(result.UserName, Is.EqualTo(_name));
        }

        //[Test]
        //public void ThenADifferentPasswordShouldFailToLogin()
        //{
        //    var query = new ValidUserLoginQuery(_command.UserName, "wrong password");
        //    var valid = Service.ExecuteNowWithTimeout(query);

        //    Assert.That(valid, Is.False);
        //}
    }
}
