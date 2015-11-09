using System;
using System.Linq;
using Marten;
using NUnit.Framework;
using Soloco.ReactiveStarterKit.Common.Infrastructure;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Common.Tests;
using Soloco.ReactiveStarterKit.Membership.Messages.Commands;
using Soloco.ReactiveStarterKit.Membership.Messages.Queries;

namespace Soloco.ReactiveStarterKit.Membership.Tests.Integration.User.RegisterExternalUserSpecifications
{
    [TestFixture]
    public class WhenRegisteringAFacebookUser : ServiceTestBase<IMessageDispatcher>
    {
        private const string _externalAccessToken = "CAAXa55GcjPYBAJnKdLV1P31gGmZCVVyOC7gm19VC1QDcAssHR8qctA6s3F1Hkc0p3PkJ6Xr1ZC0wKHEFG2ZBqd8l5nIp5VKZBdCtUk7axC3z2IK8IA9Vb3NXn0rJ3yuSDkwr5FIBpH43gcUWXq2WsEw2KgQt3wLzgcERpdZCe0FGssB3c4czZBzaXXNNunYvt82kAQZBtLZAHwZDZD";
        private const string _provider = "Facebook";

        private CommandResult _result;
        private RegisterExternalUserCommand _command;
        private string _name;

        protected override void When()
        {
            base.When();

            _name = Guid.NewGuid().ToString("n");
            _command = new RegisterExternalUserCommand(_name, _provider, _externalAccessToken);

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
            var query = new VerifyExternalUserQuery(_provider, _externalAccessToken);
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
