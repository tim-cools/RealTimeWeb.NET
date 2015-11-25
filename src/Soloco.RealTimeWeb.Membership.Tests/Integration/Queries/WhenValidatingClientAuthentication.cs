using System;
using NUnit.Framework;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Common.Tests;
using Soloco.ReactiveStarterKit.Membership.Messages.Queries;
using Soloco.ReactiveStarterKit.Membership.Messages.ViewModel;

namespace Soloco.ReactiveStarterKit.Membership.Tests.Integration.Queries
{
    [TestFixture]
    public class WhenValidatingClientAuthentication : ServiceTestBase<IMessageDispatcher>
    {
        private ValidateClientAuthenticationResult _result;
        private ValidateClientAuthenticationQuery _query;

        protected override void When()
        {
            base.When();

            var clientId = Guid.NewGuid().ToString("n");
            var clientSecret = Guid.NewGuid().ToString("n");
            _query = new ValidateClientAuthenticationQuery(clientId, clientSecret);

            _result = Service.ExecuteNowWithTimeout(_query);
        }

        [Test]
        public void ThenTheRefreshTokensShouldBeReturned()
        {
            Assert.That(_result, Is.Not.Null);
        }
    }
}