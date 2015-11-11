using System;
using System.Runtime.InteropServices;
using NUnit.Framework;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Common.Tests;
using Soloco.ReactiveStarterKit.Membership.Messages.Commands;
using Soloco.ReactiveStarterKit.Membership.Messages.Queries;

namespace Soloco.ReactiveStarterKit.Membership.Tests.Integration.Queries
{
    [TestFixture]
    public class WhenQueryingUserByName : ServiceTestBase<IMessageDispatcher>
    {
        private Messages.ViewModel.User _result;
        private UserByNameQuery _query;
        private string _userName;

        protected override void Given()
        {
            base.Given();

            _userName = Guid.NewGuid().ToString("n");
            var command = new RegisterUserCommand(
                _userName,
                Guid.NewGuid().ToString("n")
                );

            Service.Execute(command);
        }

        protected override void When()
        {
            base.When();

            _query = new UserByNameQuery(_userName);

            _result = Service.ExecuteNowWithTimeout(_query);
        }

        [Test]
        public void ThenTheRefreshTokensShouldBeReturned()
        {
            Assert.That(_result, Is.Not.Null);
        }
    }
}