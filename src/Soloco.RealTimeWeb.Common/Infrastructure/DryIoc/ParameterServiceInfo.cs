using System;
using System.Reflection;
using System.Text;

namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    /// <summary>Provides <see cref="IServiceInfo"/> for parameter, 
    /// by default using parameter name as <see cref="IServiceInfo.ServiceType"/>.</summary>
    /// <remarks>For parameter default setting <see cref="ServiceDetails.IfUnresolved"/> is <see cref="IfUnresolved.Throw"/>.</remarks>
    public class ParameterServiceInfo : IServiceInfo
    {
        /// <summary>Creates service info from parameter alone, setting service type to parameter type,
        /// and setting resolution policy to <see cref="IfUnresolved.ReturnDefault"/> if parameter is optional.</summary>
        /// <param name="parameter">Parameter to create info for.</param>
        /// <returns>Parameter service info.</returns>
        public static ParameterServiceInfo Of(ParameterInfo parameter)
        {
            parameter.ThrowIfNull();

            var isOptional = parameter.IsOptional;
            var defaultValue = isOptional ? parameter.DefaultValue : null;
            var hasDefaultValue = defaultValue != null && parameter.ParameterType.IsTypeOf(defaultValue);

            return !isOptional ? new ParameterServiceInfo(parameter)
                : new WithDetails(parameter, !hasDefaultValue
                    ? ServiceDetails.IfUnresolvedReturnDefault
                    : ServiceDetails.Of(ifUnresolved: IfUnresolved.ReturnDefault, defaultValue: defaultValue));
        }

        /// <summary>Service type specified by <see cref="ParameterInfo.ParameterType"/>.</summary>
        public virtual Type ServiceType { get { return _parameter.ParameterType; } }

        /// <summary>Optional service details.</summary>
        public virtual ServiceDetails Details { get { return ServiceDetails.Default; } }

        /// <summary>Creates info from service type and details.</summary>
        /// <param name="serviceType">Required service type.</param> <param name="details">Optional details.</param> <returns>Create info.</returns>
        public IServiceInfo Create(Type serviceType, ServiceDetails details)
        {
            return serviceType == ServiceType
                ? new WithDetails(_parameter, details)
                : new TypeWithDetails(_parameter, serviceType, details);
        }

        /// <summary>Prints info to string using <see cref="ServiceInfoTools.Print"/>.</summary> <returns>Printed string.</returns>
        public override string ToString()
        {
            return new StringBuilder().Print(this).Append(" as parameter ").Print(_parameter.Name, "\"").ToString();
        }

        #region Implementation

        private readonly ParameterInfo _parameter;

        private ParameterServiceInfo(ParameterInfo parameter) { _parameter = parameter; }

        private class WithDetails : ParameterServiceInfo
        {
            public override ServiceDetails Details { get { return _details; } }
            public WithDetails(ParameterInfo parameter, ServiceDetails details)
                : base(parameter)
            { _details = details; }
            private readonly ServiceDetails _details;
        }

        private sealed class TypeWithDetails : WithDetails
        {
            public override Type ServiceType { get { return _serviceType; } }
            public TypeWithDetails(ParameterInfo parameter, Type serviceType, ServiceDetails details)
                : base(parameter, details)
            { _serviceType = serviceType; }
            private readonly Type _serviceType;
        }

        #endregion
    }
}