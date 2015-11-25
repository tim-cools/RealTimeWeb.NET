using System;
using NUnit.Framework;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Membership.Messages.Queries;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Membership.Tests.Integration.Queries
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