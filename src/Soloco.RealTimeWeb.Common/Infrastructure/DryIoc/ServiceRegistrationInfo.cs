using System;
using System.Diagnostics;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    /// <summary>Define registered service structure.</summary>
    [DebuggerDisplay("#{FactoryRegistrationOrder}, {ServiceType}, {OptionalServiceKey}, {Factory}")]
    public struct ServiceRegistrationInfo
    {
        /// <summary>Required service type.</summary>
        public Type ServiceType;

        /// <summary>Is null single default service, or actual service key, or <see cref="DefaultKey"/> for multiple default services.</summary>
        public object OptionalServiceKey;

        /// <summary>Registered factory.</summary>
        public Factory Factory;

        /// <summary>Provides registration order across all factory registrations in container.</summary>
        /// <remarks>May be repeated for factory registered with multiple services.</remarks>
        public int FactoryRegistrationOrder;

        /// <summary>Creates info. Registration order is figured out automatically based on Factory.</summary>
        /// <param name="factory"></param> <param name="serviceType"></param> <param name="optionalServiceKey"></param>
        public ServiceRegistrationInfo(Factory factory, Type serviceType, object optionalServiceKey)
        {
            ServiceType = serviceType;
            OptionalServiceKey = optionalServiceKey;
            Factory = factory;
            FactoryRegistrationOrder = factory.FactoryID;
        }
    }
}