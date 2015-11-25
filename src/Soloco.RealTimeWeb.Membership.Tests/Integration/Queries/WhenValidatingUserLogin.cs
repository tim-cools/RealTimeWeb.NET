using System;
using NUnit.Framework;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Membership.Messages.Queries;

namespace Soloco.RealTimeWeb.Membership.Tests.Integration.Queries
{
    [TestFixture]
    public class WhenValidatingUserLogin : ServiceTestBase<IMessageDispatcher>
    {
        private bool _result;
        private ValidUserLoginQuery _query;

        protected override void When()
        {
            base.When();

            var userName = Guid.NewGuid().ToString("n");
            var password = Guid.NewGuid().ToString("n");
            _query = new ValidUserLoginQuery(userName, password);

            _result = Service.ExecuteNowWithTimeout(_query);
        }

        [Test]
        public void ThenTheRefreshTokensShouldBeReturned()
        {
            Assert.That(_result, Is.False);
        }
    }
}