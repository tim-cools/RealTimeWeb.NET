using System;
using NUnit.Framework;
using Soloco.ReactiveStarterKit.Common.Infrastructure;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Commands;
using Soloco.ReactiveStarterKit.Common.Tests;
using Soloco.ReactiveStarterKit.Common.Tests.Storage;
using Soloco.ReactiveStarterKit.Membership.Messages.Commands;
using Soloco.ReactiveStarterKit.Membership.Models;

namespace Soloco.ReactiveStarterKit.Membership.Tests.Integration.User.RegisterUserSpecifications
{
    [TestFixture]
    public class WhenRegistringAUser : ServiceTestBase<IMessageDispatcher>
    {
        private EmptyResult _result;
        private RegisterUserCommand _command;

        protected override void When()
        {
            base.When();

            _command  = new RegisterUserCommand();
            _command.UserId = Guid.NewGuid();

            _result = Service.Execute(_command);
        }

        [Test]
        public void ThenAUserShouldBeStored()
        {
            var user = Session.GetById<IdentityUser>(_command.UserId);
            Assert.IsNotNull(user);
        }
    }
}
