using System;
using System.Runtime.InteropServices;
using NUnit.Framework;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Membership.Messages.Commands;
using Soloco.RealTimeWeb.Membership.Messages.Queries;

namespace Soloco.RealTimeWeb.Membership.Tests.Integration.Queries
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