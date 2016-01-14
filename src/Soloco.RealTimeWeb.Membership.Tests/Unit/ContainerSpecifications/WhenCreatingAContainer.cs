using System.Diagnostics;
using Shouldly;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Common.Tests.Unit;
using Soloco.RealTimeWeb.Membership.Messages.Commands;
using Xunit;

namespace Soloco.RealTimeWeb.Membership.Tests.Unit.ContainerSpecifications
{
    public class WhenCreatingAContainer
    {
        [Fact]
        public void ThenMessageHandlerShouldBeGettable()
        {
            var container = TestContainerFactory.CreateContainer(config =>
            {
                config.AddRegistry<MembershipRegistry>();
            });

            Debug.WriteLine(container.WhatDidIScan());

            container.GetInstance<IHandleMessage<DeleteRefreshTokenCommand, Result>>()
                .ShouldNotBeNull();
        }
    }
}
