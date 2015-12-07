using System.Text;

namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    /// <summary>Contains tools for combining or propagating of <see cref="IServiceInfo"/> independent of its concrete implementations.</summary>
    public static class ServiceInfoTools
    {
        /// <summary>Combines service info with details: the main task is to combine service and required service type.</summary>
        /// <typeparam name="T">Type of <see cref="IServiceInfo"/>.</typeparam>
        /// <param name="serviceInfo">Source info.</param> <param name="details">Details to combine with info.</param> 
        /// <param name="request">Owner request.</param> <returns>Original source or new combined info.</returns>
        public static T WithDetails<T>(this T serviceInfo, ServiceDetails details, Request request)
            where T : IServiceInfo
        {
            var serviceType = serviceInfo.ServiceType;
            var requiredServiceType = details == null ? null : details.RequiredServiceType;
            if (requiredServiceType != null)
            {
                // Replace serviceType with Required if they are assignable
                if (requiredServiceType.IsAssignableTo(serviceType))
                {
                    serviceType = requiredServiceType; // override service type with required one
                    details = ServiceDetails.Of(null, details.ServiceKey, details.IfUnresolved);
                }
                else if (requiredServiceType.IsOpenGeneric())
                {
                    var serviceGenericDefinition = serviceType.GetGenericDefinitionOrNull();
                    if (serviceGenericDefinition == null ||
                        requiredServiceType != serviceGenericDefinition &&
                        requiredServiceType.GetImplementedServiceTypes().IndexOf(serviceGenericDefinition) == -1)
                        Throw.It(Error.ServiceIsNotAssignableFromOpenGenericRequiredServiceType,
                            serviceGenericDefinition, requiredServiceType, request);
                }
                else
                {
                    var container = request.Container;
                    var wrappedType = container.GetWrappedType(serviceType, null);
                    if (wrappedType != null)
                    {
                        var wrappedRequiredType = container.GetWrappedType(requiredServiceType, null);
                        wrappedType.ThrowIfNotImplementedBy(wrappedRequiredType, Error.WrappedNotAssignableFromRequiredType, request);
                    }
                }
            }

            return serviceType == serviceInfo.ServiceType
                   && (details == null || details == serviceInfo.Details)
                ? serviceInfo // if service type unchanged and details absent, or details are the same return original info.
                : (T)serviceInfo.Create(serviceType, details); // otherwise: create new.
        }

        /// <summary>Enables propagation/inheritance of info between dependency and its owner: 
        /// for instance <see cref="ServiceDetails.RequiredServiceType"/> for wrappers.</summary>
        /// <param name="dependency">Dependency info.</param>
        /// <param name="owner">Dependency holder/owner info.</param>
        /// <param name="shouldInheritServiceKey">(optional) Self-explanatory. Usually set to true for wrapper and decorator info.</param>
        /// <returns>Either input dependency info, or new info with properties inherited from the owner.</returns>
        public static IServiceInfo InheritInfoFromDependencyOwner(this IServiceInfo dependency, IServiceInfo owner, 
            bool shouldInheritServiceKey = false)
        {
            var ownerDetails = owner.Details;
            if (ownerDetails == null || ownerDetails == ServiceDetails.Default)
                return dependency;

            var dependencyDetails = dependency.Details;

            var ifUnresolved = ownerDetails.IfUnresolved == IfUnresolved.Throw
                ? dependencyDetails.IfUnresolved
                : ownerDetails.IfUnresolved;

            // Use dependency key if it's non default, otherwise and if owner is not service, the
            var serviceKey = dependencyDetails.ServiceKey == null && shouldInheritServiceKey
                ? ownerDetails.ServiceKey
                : dependencyDetails.ServiceKey;

            var serviceType = dependency.ServiceType;
            var requiredServiceType = dependencyDetails.RequiredServiceType;
            var ownerRequiredServiceType = ownerDetails.RequiredServiceType;
            if (ownerRequiredServiceType != null)
            {
                if (ownerRequiredServiceType.IsAssignableTo(serviceType))
                {
                    serviceType = ownerRequiredServiceType;
                    requiredServiceType = null;
                }
                else if (!ownerRequiredServiceType.IsOpenGeneric()) // propagates owner required service type further to dependency 
                    requiredServiceType = ownerRequiredServiceType;
            }

            if (serviceType == dependency.ServiceType && serviceKey == dependencyDetails.ServiceKey &&
                ifUnresolved == dependencyDetails.IfUnresolved && requiredServiceType == dependencyDetails.RequiredServiceType)
                return dependency;

            return dependency.Create(serviceType, ServiceDetails.Of(requiredServiceType, serviceKey, ifUnresolved));
        }

        /// <summary>Appends info string representation into provided builder.</summary>
        /// <param name="s">String builder to print to.</param> <param name="info">Info to print.</param>
        /// <returns>String builder with appended info.</returns>
        public static StringBuilder Print(this StringBuilder s, IServiceInfo info)
        {
            s.Print(info.ServiceType);
            var details = info.Details.ToString();
            return details == string.Empty ? s : s.Append(' ').Append(details);
        }
    }
}