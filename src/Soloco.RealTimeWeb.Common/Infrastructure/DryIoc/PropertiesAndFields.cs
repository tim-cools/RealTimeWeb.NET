using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    /// <summary>DSL for specifying <see cref="PropertiesAndFieldsSelector"/> injection rules.</summary>
    public static partial class PropertiesAndFields
    {
        /// <summary>Say to not resolve any properties or fields.</summary>
        public static PropertiesAndFieldsSelector Of = request => null;

        /// <summary>Public assignable instance members of any type except object, string, primitives types, and arrays of those.</summary>
        public static PropertiesAndFieldsSelector Auto = All(false, false);

        /// <summary>Should return service info for input member (property or field).</summary>
        /// <param name="member">Input member.</param> <param name="request">Request to provide context.</param> <returns>Service info.</returns>
        public delegate PropertyOrFieldServiceInfo GetInfo(MemberInfo member, Request request);

        /// <summary>Generates selector property and field selector with settings specified by parameters.
        /// If all parameters are omitted the return all public not primitive members.</summary>
        /// <param name="withNonPublic">(optional) Specifies to include non public members. Will include by default.</param>
        /// <param name="withPrimitive">(optional) Specifies to include members of primitive types. Will include by default.</param>
        /// <param name="withFields">(optional) Specifies to include fields as well as properties. Will include by default.</param>
        /// <param name="ifUnresolved">(optional) Defines ifUnresolved behavior for resolved members.</param>
        /// <param name="withInfo">(optional) Return service info for a member or null to skip member resolution.</param>
        /// <returns>Result selector composed using provided settings.</returns>
        public static PropertiesAndFieldsSelector All(
            bool withNonPublic = true, bool withPrimitive = true, bool withFields = true,
            IfUnresolved ifUnresolved = IfUnresolved.ReturnDefault,
            GetInfo withInfo = null)
        {
            GetInfo getInfo = (m, r) => withInfo != null ? withInfo(m, r) :
                PropertyOrFieldServiceInfo.Of(m).WithDetails(ServiceDetails.Of(ifUnresolved: ifUnresolved), r);
            return r =>
            {
                var properties = r.ImplementationType.GetDeclaredAndBase(_ => _.DeclaredProperties)
                    .Where(p => IsInjectable((PropertyInfo) p, withNonPublic, withPrimitive))
                    .Select(m => getInfo(m, r));
                return !withFields ? properties :
                    properties.Concat(r.ImplementationType.GetDeclaredAndBase(_ => _.DeclaredFields)
                        .Where(f => f.IsInjectable(withNonPublic, withPrimitive))
                        .Select(m => getInfo(m, r)));
            };
        }

        /// <summary>Combines source properties and fields with other. Other will override the source condition.</summary>
        /// <param name="source">Source selector.</param> <param name="other">Specific other selector to add.</param>
        /// <returns>Combined result selector.</returns>
        public static PropertiesAndFieldsSelector And(this PropertiesAndFieldsSelector source, PropertiesAndFieldsSelector other)
        {
            return source == null || source == Of ? (other ?? Of)
                : other == null || other == Of ? source
                    : r =>
                    {
                        var sourceMembers = source(r).ToArrayOrSelf();
                        var otherMembers = other(r).ToArrayOrSelf();
                        return sourceMembers == null || sourceMembers.Length == 0 ? otherMembers
                            : otherMembers == null || otherMembers.Length == 0 ? sourceMembers
                                : sourceMembers
                                    .Where(info => info != null && otherMembers.All(o => o == null || !info.Member.Name.Equals(o.Member.Name)))
                                    .Concat(otherMembers);
                    };
        }

        /// <summary>Specifies service details (key, if-unresolved policy, required type) for property/field with the name.</summary>
        /// <param name="source">Original member selector.</param> <param name="name">Member name.</param> <param name="getDetails">Details.</param>
        /// <returns>New selector.</returns>
        public static PropertiesAndFieldsSelector Details(this PropertiesAndFieldsSelector source, string name, Func<Request, ServiceDetails> getDetails)
        {
            name.ThrowIfNull();
            getDetails.ThrowIfNull();
            return source.And(request =>
            {
                var implementationType = request.ImplementationType;

                var property = implementationType.GetPropertyOrNull(name);
                if (property != null && property.IsInjectable(true, true))
                {
                    var details = getDetails(request);
                    return details == null ? null
                        : new[] { PropertyOrFieldServiceInfo.Of(property).WithDetails(details, request) };
                }

                var field = implementationType.GetFieldOrNull(name);
                if (field != null && field.IsInjectable(true, true))
                {
                    var details = getDetails(request);
                    return details == null ? null
                        : new[] { PropertyOrFieldServiceInfo.Of(field).WithDetails(details, request) };
                }

                return Throw.For<IEnumerable<PropertyOrFieldServiceInfo>>(Error.NotFoundSpecifiedWritablePropertyOrField, name, request);
            });
        }

        /// <summary>Adds to <paramref name="source"/> selector service info for property/field identified by <paramref name="name"/>.</summary>
        /// <param name="source">Source selector.</param> <param name="name">Name to identify member.</param>
        /// <param name="requiredServiceType">(optional)</param> <param name="serviceKey">(optional)</param>
        /// <param name="ifUnresolved">(optional) By default returns default value if unresolved.</param>
        /// <param name="defaultValue">(optional) Specifies default value to use when unresolved.</param>
        /// <returns>Combined selector.</returns>
        public static PropertiesAndFieldsSelector Name(this PropertiesAndFieldsSelector source, string name,
            Type requiredServiceType = null, object serviceKey = null, IfUnresolved ifUnresolved = IfUnresolved.ReturnDefault, object defaultValue = null)
        {
            return source.Details(name, r => ServiceDetails.Of(requiredServiceType, serviceKey, ifUnresolved, defaultValue));
        }

        /// <summary>Specifies custom value for property/field with specific name.</summary>
        /// <param name="source">Original property/field list.</param>
        /// <param name="name">Target member name.</param> <param name="getCustomValue">Custom value provider.</param>
        /// <returns>Return new combined selector.</returns>
        public static PropertiesAndFieldsSelector Name(this PropertiesAndFieldsSelector source, string name, Func<Request, object> getCustomValue)
        {
            return source.Details(name, r => ServiceDetails.Of(getCustomValue(r)));
        }

        /// <summary>Returns true if property matches flags provided.</summary>
        /// <param name="property">Property to match</param>
        /// <param name="withNonPublic">Says to include non public properties.</param>
        /// <param name="withPrimitive">Says to include properties of primitive type.</param>
        /// <returns>True if property is matched and false otherwise.</returns>
        public static bool IsInjectable(this PropertyInfo property, bool withNonPublic = false, bool withPrimitive = false)
        {
            return property.CanWrite && !property.IsIndexer() // first checks that property is assignable in general and not an indexer
                   && (withNonPublic || property.GetSetMethodOrNull() != null)
                   && (withPrimitive || !property.PropertyType.IsPrimitive(orArrayOfPrimitives: true));
        }

        /// <summary>Returns true if field matches flags provided.</summary>
        /// <param name="field">Field to match.</param>
        /// <param name="withNonPublic">Says to include non public fields.</param>
        /// <param name="withPrimitive">Says to include fields of primitive type.</param>
        /// <returns>True if property is matched and false otherwise.</returns>
        public static bool IsInjectable(this FieldInfo field, bool withNonPublic = false, bool withPrimitive = false)
        {
            return !field.IsInitOnly && !field.IsBackingField()
                   && (withNonPublic || field.IsPublic)
                   && (withPrimitive || !field.FieldType.IsPrimitive(orArrayOfPrimitives: true));
        }
    }
}