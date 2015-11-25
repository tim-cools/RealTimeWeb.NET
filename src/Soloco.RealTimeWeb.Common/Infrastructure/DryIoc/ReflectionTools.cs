using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    /// <summary>Contains helper methods to work with Type: for instance to find Type implemented base types and interfaces, etc.</summary>
    public static class ReflectionTools
    {
        /// <summary>Flags for <see cref="GetImplementedTypes"/> method.</summary>
        [Flags]
        public enum AsImplementedType
        {
            /// <summary>Include nor object not source type.</summary>
            None = 0,
            /// <summary>Include source type to list of implemented types.</summary>
            SourceType = 1,
            /// <summary>Include <see cref="System.Object"/> type to list of implemented types.</summary>
            ObjectType = 2
        }

        /// <summary>Returns all interfaces and all base types (in that order) implemented by <paramref name="sourceType"/>.
        /// Specify <paramref name="asImplementedType"/> to include <paramref name="sourceType"/> itself as first item and 
        /// <see cref="object"/> type as the last item.</summary>
        /// <param name="sourceType">Source type for discovery.</param>
        /// <param name="asImplementedType">Additional types to include into result collection.</param>
        /// <returns>Array of found types, empty if nothing found.</returns>
        public static Type[] GetImplementedTypes(this Type sourceType, AsImplementedType asImplementedType = AsImplementedType.None)
        {
            Type[] results;

            var interfaces = sourceType.GetImplementedInterfaces();
            var interfaceStartIndex = (asImplementedType & AsImplementedType.SourceType) == 0 ? 0 : 1;
            var includingObjectType = (asImplementedType & AsImplementedType.ObjectType) == 0 ? 0 : 1;
            var sourcePlusInterfaceCount = interfaceStartIndex + interfaces.Length;

            var baseType = sourceType.GetTypeInfo().BaseType;
            if (baseType == null || baseType == typeof(object))
                results = new Type[sourcePlusInterfaceCount + includingObjectType];
            else
            {
                List<Type> baseBaseTypes = null;
                for (var bb = baseType.GetTypeInfo().BaseType; bb != null && bb != typeof(object); bb = bb.GetTypeInfo().BaseType)
                    (baseBaseTypes ?? (baseBaseTypes = new List<Type>(2))).Add(bb);

                if (baseBaseTypes == null)
                    results = new Type[sourcePlusInterfaceCount + includingObjectType + 1];
                else
                {
                    results = new Type[sourcePlusInterfaceCount + baseBaseTypes.Count + includingObjectType + 1];
                    baseBaseTypes.CopyTo(results, sourcePlusInterfaceCount + 1);
                }

                results[sourcePlusInterfaceCount] = baseType;
            }

            if (interfaces.Length == 1)
                results[interfaceStartIndex] = interfaces[0];
            else if (interfaces.Length > 1)
                Array.Copy(interfaces, 0, results, interfaceStartIndex, interfaces.Length);

            if (interfaceStartIndex == 1)
                results[0] = sourceType;
            if (includingObjectType == 1)
                results[results.Length - 1] = typeof(object);

            return results;
        }

        /// <summary>Gets a collection of the interfaces implemented by the current type and its base types.</summary>
        /// <param name="type">Source type</param>
        /// <returns>Collection of interface types.</returns>
        public static Type[] GetImplementedInterfaces(this Type type)
        {
            return type.GetTypeInfo().ImplementedInterfaces.ToArrayOrSelf();
        }

        /// <summary>Gets all decalred and base members.</summary>
        /// <param name="type">Type to get members from.</param> <returns>All members.</returns>
        public static IEnumerable<MemberInfo> GetAllMembers(this Type type)
        {
            return type.GetDeclaredAndBase(t =>
                t.DeclaredMethods.Cast<MemberInfo>().Concat(
                    t.DeclaredProperties.Cast<MemberInfo>().Concat(
                        t.DeclaredFields.Cast<MemberInfo>())));
        }

        /// <summary>Returns true if <paramref name="openGenericType"/> contains all generic parameters from <paramref name="genericParameters"/>.</summary>
        /// <param name="openGenericType">Expected to be open-generic type.</param>
        /// <param name="genericParameters">Generic parameters.</param>
        /// <returns>Returns true if contains and false otherwise.</returns>
        public static bool ContainsAllGenericTypeParameters(this Type openGenericType, Type[] genericParameters)
        {
            if (!openGenericType.IsOpenGeneric())
                return false;

            // NOTE: may be replaced with more lightweight Bits flags.
            var matchedParams = new Type[genericParameters.Length];
            Array.Copy(genericParameters, matchedParams, genericParameters.Length);

            SetToNullGenericParametersReferencedInConstraints(matchedParams);
            SetToNullMatchesFoundInGenericParameters(matchedParams, openGenericType.GetGenericParamsAndArgs());

            for (var i = 0; i < matchedParams.Length; i++)
                if (matchedParams[i] != null)
                    return false;
            return true;
        }

        /// <summary>Returns true if class is compiler generated. Checking for CompilerGeneratedAttribute
        /// is not enough, because this attribute is not applied for classes generated from "async/await".</summary>
        /// <param name="type">Type to check.</param> <returns>Returns true if type is compiler generated.</returns>
        public static bool IsCompilerGenerated(this Type type)
        {
            return type.FullName != null && type.FullName.Contains("<>c__DisplayClass");
        }

        /// <summary>Returns true if type is generic.</summary><param name="type">Type to check.</param> <returns>True if type generic.</returns>
        public static bool IsGeneric(this Type type)
        {
            return type.GetTypeInfo().IsGenericType;
        }

        /// <summary>Returns true if type is generic type definition (open type).</summary><param name="type">Type to check.</param>
        /// <returns>True if type is open type: generic type definition.</returns>
        public static bool IsGenericDefinition(this Type type)
        {
            return type.GetTypeInfo().IsGenericTypeDefinition;
        }

        /// <summary>Returns true if type is closed generic: does not have open generic parameters, only closed/concrete ones.</summary>
        /// <param name="type">Type to check</param> <returns>True if closed generic.</returns>
        public static bool IsClosedGeneric(this Type type)
        {
            var typeInfo = type.GetTypeInfo();
            return typeInfo.IsGenericType && !typeInfo.ContainsGenericParameters;
        }

        /// <summary>Returns true if type if open generic: contains at list one open generic parameter. Could be
        /// generic type definition as well.</summary>
        /// <param name="type">Type to check.</param> <returns>True if open generic.</returns>
        public static bool IsOpenGeneric(this Type type)
        {
            var typeInfo = type.GetTypeInfo();
            return typeInfo.IsGenericType && typeInfo.ContainsGenericParameters;
        }

        /// <summary>Returns generic type definition if type is generic and null otherwise.</summary>
        /// <param name="type">Source type, could be null.</param> <returns>Generic type definition.</returns>
        public static Type GetGenericDefinitionOrNull(this Type type)
        {
            return type != null && type.GetTypeInfo().IsGenericType ? type.GetGenericTypeDefinition() : null;
        }

        /// <summary>Returns generic type parameters and arguments in order they specified. If type is not generic, returns empty array.</summary>
        /// <param name="type">Source type.</param> <returns>Array of generic type arguments (closed/concrete types) and parameters (open).</returns>
        public static Type[] GetGenericParamsAndArgs(this Type type)
        {
            return Portable.GetGenericArguments(type);
        }

        /// <summary>Returns array of interface and base class constraints for provider generic parameter type.</summary>
        /// <param name="type">Generic parameter type.</param>
        /// <returns>Array of interface and base class constraints.</returns>
        public static Type[] GetGenericParamConstraints(this Type type)
        {
            return type.GetTypeInfo().GetGenericParameterConstraints();
        }

        /// <summary>If type is array returns is element type, otherwise returns null.</summary>
        /// <param name="type">Source type.</param> <returns>Array element type or null.</returns>
        public static Type GetArrayElementTypeOrNull(this Type type)
        {
            var typeInfo = type.GetTypeInfo();
            return typeInfo.IsArray ? typeInfo.GetElementType() : null;
        }

        /// <summary>Return base type or null, if not exist (the case for only for object type).</summary> 
        /// <param name="type">Source type.</param> <returns>Base type or null for object.</returns>
        public static Type GetBaseType(this Type type)
        {
            return type.GetTypeInfo().BaseType;
        }

        /// <summary>Checks if type is public or nested public in public type.</summary>
        /// <param name="type">Type to check.</param> <returns>Return true if check succeeded.</returns>
        public static bool IsPublicOrNestedPublic(this Type type)
        {
            var typeInfo = type.GetTypeInfo();
            return typeInfo.IsPublic || typeInfo.IsNestedPublic && typeInfo.DeclaringType.IsPublicOrNestedPublic();
        }

        /// <summary>Returns true if type is value type.</summary>
        /// <param name="type">Type to check.</param> <returns>Check result.</returns>
        public static bool IsValueType(this Type type)
        {
            return type.GetTypeInfo().IsValueType;
        }

        /// <summary>Returns true if type if abstract or interface.</summary>
        /// <param name="type">Type to check.</param> <returns>Check result.</returns>
        public static bool IsAbstract(this Type type)
        {
            return type.GetTypeInfo().IsAbstract;
        }

        /// <summary>Returns true if type is static.</summary>
        /// <param name="type">Type</param> <returns>True is static.</returns>
        public static bool IsStatic(this Type type)
        {
            var typeInfo = type.GetTypeInfo();
            return typeInfo.IsAbstract && typeInfo.IsSealed;
        }

        /// <summary>Returns true if type is enum type.</summary>
        /// <param name="type">Type to check.</param> <returns>Check result.</returns>
        public static bool IsEnum(this Type type)
        {
            return type.GetTypeInfo().IsEnum;
        }

        /// <summary>Returns true if instance of type is assignable to instance of <paramref name="other"/> type.</summary>
        /// <param name="type">Type to check, could be null.</param> 
        /// <param name="other">Other type to check, could be null.</param>
        /// <returns>Check result.</returns>
        public static bool IsAssignableTo(this Type type, Type other)
        {
            return type != null && other != null && other.GetTypeInfo().IsAssignableFrom(type.GetTypeInfo());
        }

        /// <summary>Returns true if type of <paramref name="obj"/> is assignable to source <paramref name="type"/>.</summary>
        /// <param name="type">Is type of object.</param> <param name="obj">Object to check.</param>
        /// <returns>Check result.</returns>
        public static bool IsTypeOf(this Type type, object obj)
        {
            return obj != null && obj.GetType().IsAssignableTo(type);
        }

        /// <summary>Returns true if provided type IsPitmitive in .Net terms, or enum, or string
        /// , or array of primitives if <paramref name="orArrayOfPrimitives"/> is true.</summary>
        /// <param name="type">Type to check.</param> 
        /// <param name="orArrayOfPrimitives">Says to return true for array or primitives recursively.</param>
        /// <returns>Check result.</returns>
        public static bool IsPrimitive(this Type type, bool orArrayOfPrimitives = false)
        {
            var typeInfo = type.GetTypeInfo();
            return typeInfo.IsPrimitive || typeInfo.IsEnum || type == typeof(string)
                   || orArrayOfPrimitives && typeInfo.IsArray && typeInfo.GetElementType().IsPrimitive(true);
        }

        /// <summary>Returns all attributes defined on <paramref name="type"/>.</summary>
        /// <param name="type">Type to get attributes for.</param>
        /// <param name="attributeType">(optional) Check only for that attribute type, otherwise for any attribute.</param>
        /// <param name="inherit">(optional) Additionally check for attributes inherited from base type.</param>
        /// <returns>Sequence of found attributes or empty.</returns>
        public static Attribute[] GetAttributes(this Type type, Type attributeType = null, bool inherit = false)
        {
            return type.GetTypeInfo().GetCustomAttributes(attributeType ?? typeof(Attribute), inherit)
                // ReSharper disable once RedundantEnumerableCastCall
                .Cast<Attribute>() // required in .NET 4.5
                .ToArrayOrSelf();
        }

        /// <summary>Recursive method to enumerate all input type and its base types for specific details.
        /// Details are returned by <paramref name="getDeclared"/> delegate.</summary>
        /// <typeparam name="T">Details type: properties, fields, methods, etc.</typeparam>
        /// <param name="type">Input type.</param> <param name="getDeclared">Get declared type details.</param>
        /// <returns>Enumerated details info objects.</returns>
        public static IEnumerable<T> GetDeclaredAndBase<T>(this Type type, Func<TypeInfo, IEnumerable<T>> getDeclared)
        {
            var typeInfo = type.GetTypeInfo();
            var declared = getDeclared(typeInfo);
            var baseType = typeInfo.BaseType;
            return baseType == null || baseType == typeof(object) ? declared
                : declared.Concat(baseType.GetDeclaredAndBase(getDeclared));
        }

        /// <summary>Enumerates all constructors from input type.</summary>
        /// <param name="type">Input type.</param>
        /// <param name="includeNonPublic">(optional) If set include non-public constructors into result.</param>
        /// <param name="includeStatic">(optional) Turned off by default.</param>
        /// <returns>Enumerated constructors.</returns>
        public static IEnumerable<ConstructorInfo> GetAllConstructors(this Type type,
            bool includeNonPublic = false, bool includeStatic = false)
        {
            var ctors = type.GetTypeInfo().DeclaredConstructors;
            if (!includeNonPublic) ctors = ctors.Where(c => c.IsPublic);
            if (!includeStatic) ctors = ctors.Where(c => !c.IsStatic);
            return ctors;
        }

        /// <summary>Searches and returns constructor by its signature.</summary>
        /// <param name="type">Input type.</param>
        /// <param name="includeNonPublic">(optional) If set include non-public constructors into result.</param>
        /// <param name="args">Signature - constructor argument types.</param>
        /// <returns>Found constructor or null.</returns>
        public static ConstructorInfo GetConstructorOrNull(this Type type, bool includeNonPublic = false, params Type[] args)
        {
            return type.GetAllConstructors(includeNonPublic)
                .FirstOrDefault(c => c.GetParameters().Select(p => p.ParameterType).SequenceEqual(args));
        }

        /// <summary>Returns single constructor, otherwise if no or more than one: returns false.</summary>
        /// <param name="type">Type to inspect.</param>
        /// <param name="includeNonPublic">(optional) If set includes non-public constructors.</param>
        /// <returns>Single constructor or null.</returns>
        public static ConstructorInfo GetSingleConstructorOrNull(this Type type, bool includeNonPublic = false)
        {
            var ctors = type.GetAllConstructors(includeNonPublic).ToArrayOrSelf();
            return ctors.Length == 1 ? ctors[0] : null;
        }

        /// <summary>Returns single declared (not inherited) method by name, or null if not found.</summary>
        /// <param name="type">Input type</param> <param name="name">Method name to look for.</param>
        /// <param name="includeNonPublic">(optional) If set includes non public methods into search.</param>
        /// <returns>Found method or null.</returns>
        public static MethodInfo GetSingleMethodOrNull(this Type type, string name, bool includeNonPublic = false)
        {
            var methods = type.GetTypeInfo().DeclaredMethods
                .Where(m => (includeNonPublic || m.IsPublic) && m.Name == name)
                .ToArrayOrSelf();
            return methods.Length == 1 ? methods[0] : null;
        }

        /// <summary>Returns declared (not inherited) method by name and argument types, or null if not found.</summary>
        /// <param name="type">Input type</param> <param name="name">Method name to look for.</param>
        /// <param name="args">Argument types</param> <returns>Found method or null.</returns>
        public static MethodInfo GetMethodOrNull(this Type type, string name, params Type[] args)
        {
            return type.GetTypeInfo().DeclaredMethods.FirstOrDefault(m =>
                m.Name == name && args.SequenceEqual(m.GetParameters().Select(p => p.ParameterType)));
        }

        /// <summary>Returns property by name, including inherited. Or null if not found.</summary>
        /// <param name="type">Input type.</param> <param name="name">Property name to look for.</param>
        /// <returns>Found property or null.</returns>
        public static PropertyInfo GetPropertyOrNull(this Type type, string name)
        {
            return type.GetDeclaredAndBase(_ => _.DeclaredProperties).FirstOrDefault(p => p.Name == name);
        }

        /// <summary>Returns field by name, including inherited. Or null if not found.</summary>
        /// <param name="type">Input type.</param> <param name="name">Field name to look for.</param>
        /// <returns>Found field or null.</returns>
        public static FieldInfo GetFieldOrNull(this Type type, string name)
        {
            return type.GetDeclaredAndBase(_ => _.DeclaredFields).FirstOrDefault(p => p.Name == name);
        }

        /// <summary>Returns type assembly.</summary> <param name="type">Input type</param> <returns>Type assembly.</returns>
        public static Assembly GetAssembly(this Type type) { return type.GetTypeInfo().Assembly; }

        /// <summary>Returns true if member is static, otherwise returns false.</summary>
        /// <param name="member">Member to check.</param> <returns>True if static.</returns>
        public static bool IsStatic(this MemberInfo member)
        {
            var isStatic =
                member is MethodInfo ? ((MethodInfo)member).IsStatic :
                    member is PropertyInfo
                        ? (((PropertyInfo)member).GetGetMethodOrNull(includeNonPublic: true)
                           ?? ((PropertyInfo)member).GetSetMethodOrNull(includeNonPublic: true)).IsStatic :
                        ((FieldInfo)member).IsStatic;
            return isStatic;
        }

        /// <summary>Return either <see cref="PropertyInfo.PropertyType"/>, or <see cref="FieldInfo.FieldType"/>, <see cref="MethodInfo.ReturnType"/>.
        /// Otherwise returns null.</summary>
        /// <param name="member">Expecting member of type <see cref="PropertyInfo"/> or <see cref="FieldInfo"/> only.</param>
        /// <returns>Type of property of field.</returns>
        public static Type GetReturnTypeOrDefault(this MemberInfo member)
        {
            return member is ConstructorInfo ? member.DeclaringType
                : member is MethodInfo ? ((MethodInfo)member).ReturnType
                    : member is PropertyInfo ? ((PropertyInfo)member).PropertyType
                        : member is FieldInfo ? ((FieldInfo)member).FieldType
                            : null;
        }

        /// <summary>Returns true if field is backing field for property.</summary>
        /// <param name="field">Field to check.</param> <returns>Returns true if field is backing property.</returns>
        public static bool IsBackingField(this FieldInfo field)
        {
            return field.Name[0] == '<';
        }

        /// <summary>Returns true if property is indexer: aka this[].</summary>
        /// <param name="property">Property to check</param><returns>True if indexer.</returns>
        public static bool IsIndexer(this PropertyInfo property)
        {
            return property.GetIndexParameters().Length != 0;
        }

        /// <summary>Returns attributes defined for the member/method.</summary>
        /// <param name="member">Member to check.</param> <param name="attributeType">(optional) Specific attribute type to return, any attribute otherwise.</param>
        /// <param name="inherit">Check for inherited member attributes.</param> <returns>Found attributes or empty.</returns>
        public static IEnumerable<Attribute> GetAttributes(this MemberInfo member, Type attributeType = null, bool inherit = false)
        {
            return member.GetCustomAttributes(attributeType ?? typeof(Attribute), inherit).Cast<Attribute>();
        }

        /// <summary>Returns attributes defined for parameter.</summary>
        ///  <param name="parameter">Target parameter.</param> 
        /// <param name="attributeType">(optional) Specific attribute type to return, any attribute otherwise.</param>
        /// <param name="inherit">Check for inherited attributes.</param> <returns>Found attributes or empty.</returns>
        public static IEnumerable<Attribute> GetAttributes(this ParameterInfo parameter, Type attributeType = null, bool inherit = false)
        {
            return parameter.GetCustomAttributes(attributeType ?? typeof(Attribute), inherit).Cast<Attribute>();
        }

        /// <summary>Get types from assembly that are loaded successfully. 
        /// Hacks to <see cref="ReflectionTypeLoadException"/> for loaded types.</summary>
        /// <param name="assembly">Assembly to get types from.</param>
        /// <returns>Array of loaded types.</returns>
        public static Type[] GetLoadedTypes(this Assembly assembly)
        {
            Type[] types;
            try
            {
                types = Portable.GetAssemblyTypes(assembly).ToArrayOrSelf();
            }
            catch (ReflectionTypeLoadException ex)
            {
                types = ex.Types.Where(type => type != null).ToArrayOrSelf();
            }
            return types;
        }

        #region Implementation

        private static void SetToNullGenericParametersReferencedInConstraints(Type[] genericParams)
        {
            for (int i = 0; i < genericParams.Length; i++)
            {
                var genericParam = genericParams[i];
                if (genericParam == null)
                    continue;

                var genericConstraints = genericParam.GetGenericParamConstraints();
                for (var j = 0; j < genericConstraints.Length; j++)
                {
                    var genericConstraint = genericConstraints[j];
                    if (genericConstraint.IsOpenGeneric())
                    {
                        var constraintGenericParams = genericConstraint.GetGenericParamsAndArgs();
                        for (var k = 0; k < constraintGenericParams.Length; k++)
                        {
                            var constraintGenericParam = constraintGenericParams[k];
                            if (constraintGenericParam != genericParam)
                            {
                                var genericParamIndex = genericParams.IndexOf(constraintGenericParam);
                                if (genericParamIndex != -1)
                                    genericParams[genericParamIndex] = null;
                            }
                        }
                    }
                }
            }
        }

        private static void SetToNullMatchesFoundInGenericParameters(Type[] matchedParams, Type[] genericParams)
        {
            for (var i = 0; i < genericParams.Length; i++)
            {
                var genericParam = genericParams[i];
                if (genericParam.IsGenericParameter)
                {
                    var matchedIndex = matchedParams.IndexOf(genericParam);
                    if (matchedIndex != -1)
                        matchedParams[matchedIndex] = null;
                }
                else if (genericParam.IsOpenGeneric())
                    SetToNullMatchesFoundInGenericParameters(matchedParams, genericParam.GetGenericParamsAndArgs());
            }
        }

        #endregion
    }
}