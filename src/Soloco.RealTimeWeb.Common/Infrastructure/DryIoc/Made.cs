using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;

namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    /// <summary>Rules how to: <list type="bullet">
    /// <item>Select constructor for creating service with <see cref="FactoryMethod"/>.</item>
    /// <item>Specify how to resolve constructor parameters with <see cref="Parameters"/>.</item>
    /// <item>Specify what properties/fields to resolve and how with <see cref="PropertiesAndFields"/>.</item>
    /// </list></summary>
    public class Made
    {
        /// <summary>Returns delegate to select constructor based on provided request.</summary>
        public FactoryMethodSelector FactoryMethod { get; private set; }

        /// <summary>Return type of strongly-typed factory method expression.</summary>
        public Type FactoryMethodKnownResultType { get; private set; }

        /// <summary>Specifies how constructor parameters should be resolved: 
        /// parameter service key and type, throw or return default value if parameter is unresolved.</summary>
        public ParameterSelector Parameters { get; private set; }

        /// <summary>Specifies what <see cref="ServiceInfo"/> should be used when resolving property or field.</summary>
        public PropertiesAndFieldsSelector PropertiesAndFields { get; private set; }

        /// <summary>Container will use some sensible defaults for service creation.</summary>
        public static readonly Made Default = new Made();

        /// <summary>Creates rules with only <see cref="FactoryMethod"/> specified.</summary>
        /// <param name="factoryMethod">To use.</param> <returns>New rules.</returns>
        public static implicit operator Made(FactoryMethodSelector factoryMethod)
        {
            return Of(factoryMethod);
        }

        /// <summary>Creates rules with only <see cref="Parameters"/> specified.</summary>
        /// <param name="parameters">To use.</param> <returns>New rules.</returns>
        public static implicit operator Made(ParameterSelector parameters)
        {
            return Of(parameters: parameters);
        }

        /// <summary>Creates rules with only <see cref="PropertiesAndFields"/> specified.</summary>
        /// <param name="propertiesAndFields">To use.</param> <returns>New rules.</returns>
        public static implicit operator Made(PropertiesAndFieldsSelector propertiesAndFields)
        {
            return Of(propertiesAndFields: propertiesAndFields);
        }

        /// <summary>Specifies injections rules for Constructor, Parameters, Properties and Fields. If no rules specified returns <see cref="Default"/> rules.</summary>
        /// <param name="factoryMethod">(optional)</param> <param name="parameters">(optional)</param> <param name="propertiesAndFields">(optional)</param>
        /// <returns>New injection rules or <see cref="Default"/>.</returns>
        public static Made Of(FactoryMethodSelector factoryMethod = null, ParameterSelector parameters = null,
            PropertiesAndFieldsSelector propertiesAndFields = null)
        {
            return factoryMethod == null && parameters == null && propertiesAndFields == null
                ? Default : new Made(factoryMethod, parameters, propertiesAndFields);
        }

        /// <summary>Specifies injections rules for Constructor, Parameters, Properties and Fields. If no rules specified returns <see cref="Default"/> rules.</summary>
        /// <param name="factoryMethod">Known factory method.</param>
        /// <returns>New injection rules.</returns>
        public static Made Of(FactoryMethod factoryMethod)
        {
            var methodReturnType = factoryMethod.ConstructorOrMethodOrMember.GetReturnTypeOrDefault();

            // Normalizes open-generic type to open-generic definition, 
            // because for base classes and return types it may not be the case.
            if (methodReturnType != null && methodReturnType.IsOpenGeneric())
                methodReturnType = methodReturnType.GetGenericTypeDefinition();

            return new Made(_ => factoryMethod, factoryMethodKnownResultType: methodReturnType);
        }

        /// <summary>Creates rules with only <see cref="FactoryMethod"/> specified.</summary>
        /// <param name="factoryMethodOrMember">To create service.</param>
        /// <param name="factoryInfo">(optional) Factory info to resolve in case of instance member.</param>
        /// <returns>New rules.</returns>
        public static Made Of(MemberInfo factoryMethodOrMember, ServiceInfo factoryInfo = null)
        {
            return Of(DryIoc.FactoryMethod.Of(factoryMethodOrMember, factoryInfo));
        }

        /// <summary>Defines how to select constructor from implementation type.</summary>
        /// <param name="getConstructor">Delegate taking implementation type as input and returning selected constructor info.</param>
        /// <param name="parameters">(optional)</param> <param name="propertiesAndFields">(optional)</param>
        /// <returns>New instance of <see cref="Made"/> with <see cref="FactoryMethod"/> set to specified delegate.</returns>
        public static Made Of(Func<Type, ConstructorInfo> getConstructor, ParameterSelector parameters = null,
            PropertiesAndFieldsSelector propertiesAndFields = null)
        {
            return Of(r => DryIoc.FactoryMethod.Of(getConstructor(r.ImplementationType)
                .ThrowIfNull(Error.GotNullConstructorFromFactoryMethod, r)), 
                parameters, propertiesAndFields);
        }

        /// <summary>Defines factory method using expression of constructor call (with properties), or static method call.</summary>
        /// <typeparam name="TService">Type with constructor or static method.</typeparam>
        /// <param name="serviceReturningExpr">Expression tree with call to constructor with properties: 
        /// <code lang="cs"><![CDATA[() => new Car(Arg.Of<IEngine>()) { Color = Arg.Of<Color>("CarColor") }]]></code>
        /// or static method call <code lang="cs"><![CDATA[() => Car.Create(Arg.Of<IEngine>())]]></code></param>
        /// <param name="argValues">(optional) Primitive custom values for dependencies.</param>
        /// <returns>New Made specification.</returns>
        public static TypedMade<TService> Of<TService>(
            Expression<Func<TService>> serviceReturningExpr,
            params Func<Request, object>[] argValues)
        {
            return FromExpression<TService>(null, serviceReturningExpr, argValues);
        }

        /// <summary>Defines creation info from factory method call Expression without using strings.
        /// You can supply any/default arguments to factory method, they won't be used, it is only to find the <see cref="MethodInfo"/>.</summary>
        /// <typeparam name="TFactory">Factory type.</typeparam> <typeparam name="TService">Factory product type.</typeparam>
        /// <param name="getFactoryInfo">Returns or resolves factory instance.</param> 
        /// <param name="serviceReturningExpr">Method, property or field expression returning service.</param>
        /// <param name="argValues">(optional) Primitive custom values for dependencies.</param>
        /// <returns>New Made specification.</returns>
        public static TypedMade<TService> Of<TFactory, TService>(
            Func<Request, ServiceInfo.Typed<TFactory>> getFactoryInfo,
            Expression<Func<TFactory, TService>> serviceReturningExpr,
            params Func<Request, object>[] argValues)
            where TFactory : class
        {
            getFactoryInfo.ThrowIfNull();
            // NOTE: cannot convert to method group because of lack of covariance support in .Net 3.5
            return FromExpression<TService>(r => getFactoryInfo(r).ThrowIfNull(), serviceReturningExpr, argValues);
        }

        private static TypedMade<TService> FromExpression<TService>(
            Func<Request, ServiceInfo> getFactoryInfo,
            LambdaExpression serviceReturningExpr,
            params Func<Request, object>[] argValues)
        {
            var callExpr = serviceReturningExpr.ThrowIfNull().Body;
            if (callExpr.NodeType == ExpressionType.Convert) // proceed without Cast expression.
                return FromExpression<TService>(getFactoryInfo,
                    Expression.Lambda(((UnaryExpression)callExpr).Operand, ArrayTools.Empty<ParameterExpression>()),
                    argValues);

            MemberInfo ctorOrMethodOrMember;
            IList<Expression> argExprs = null;
            IList<MemberBinding> memberBindingExprs = null;
            ParameterInfo[] parameters = null;

            if (callExpr.NodeType == ExpressionType.New || callExpr.NodeType == ExpressionType.MemberInit)
            {
                var newExpr = callExpr as NewExpression ?? ((MemberInitExpression)callExpr).NewExpression;
                ctorOrMethodOrMember = newExpr.Constructor;
                parameters = newExpr.Constructor.GetParameters();
                argExprs = newExpr.Arguments;
                if (callExpr is MemberInitExpression)
                    memberBindingExprs = ((MemberInitExpression)callExpr).Bindings;
            }
            else if (callExpr.NodeType == ExpressionType.Call)
            {
                var methodCallExpr = ((MethodCallExpression)callExpr);
                ctorOrMethodOrMember = methodCallExpr.Method;
                parameters = methodCallExpr.Method.GetParameters();
                argExprs = methodCallExpr.Arguments;
            }
            else if (callExpr.NodeType == ExpressionType.Invoke)
            {
                var invokeExpr = ((InvocationExpression)callExpr);
                var invokedDelegateExpr = invokeExpr.Expression;
                var invokeMethod = invokedDelegateExpr.Type.GetSingleMethodOrNull("Invoke");
                ctorOrMethodOrMember = invokeMethod;
                parameters = invokeMethod.GetParameters();
                argExprs = invokeExpr.Arguments;
            }

            else if (callExpr.NodeType == ExpressionType.MemberAccess)
            {
                var member = ((MemberExpression)callExpr).Member;
                Throw.If(!(member is PropertyInfo) && !(member is FieldInfo),
                    Error.UnexpectedFactoryMemberExpression, member);
                ctorOrMethodOrMember = member;
            }
            else return Throw.For<TypedMade<TService>>(Error.NotSupportedMadeExpression, callExpr);

            FactoryMethodSelector factoryMethod = request =>
                DryIoc.FactoryMethod.Of(ctorOrMethodOrMember, getFactoryInfo == null ? null : getFactoryInfo(request));

            var parameterSelector = parameters.IsNullOrEmpty() ? null
                : ComposeParameterSelectorFromArgs(parameters, argExprs, argValues);

            var propertiesAndFieldsSelector =
                memberBindingExprs == null || memberBindingExprs.Count == 0 ? null
                    : ComposePropertiesAndFieldsSelector(memberBindingExprs, argValues);

            return new TypedMade<TService>(factoryMethod, parameterSelector, propertiesAndFieldsSelector);
        }

        /// <summary>Typed version of <see cref="Made"/> specified with statically typed expression tree.</summary>
        /// <typeparam name="TService">Type that expression returns.</typeparam>
        public sealed class TypedMade<TService> : Made
        {
            /// <summary>Creates typed version.</summary>
            /// <param name="factoryMethod"></param> <param name="parameters"></param> <param name="propertiesAndFields"></param>
            internal TypedMade(FactoryMethodSelector factoryMethod = null,
                ParameterSelector parameters = null, PropertiesAndFieldsSelector propertiesAndFields = null)
                : base(factoryMethod, parameters, propertiesAndFields, typeof(TService))
            { }
        }

        #region Implementation

        private Made(FactoryMethodSelector factoryMethod = null, ParameterSelector parameters = null, PropertiesAndFieldsSelector propertiesAndFields = null,
            Type factoryMethodKnownResultType = null)
        {
            FactoryMethod = factoryMethod;
            Parameters = parameters;
            PropertiesAndFields = propertiesAndFields;
            FactoryMethodKnownResultType = factoryMethodKnownResultType;
        }

        private static ParameterSelector ComposeParameterSelectorFromArgs(
            ParameterInfo[] parameterInfos, IList<Expression> argExprs, params Func<Request, object>[] argValues)
        {
            var parameters = DryIoc.Parameters.Of;
            for (var i = 0; i < argExprs.Count; i++)
            {
                var parameter = parameterInfos[i];
                var methodCallExpr = argExprs[i] as MethodCallExpression;
                if (methodCallExpr != null)
                {
                    Throw.If(methodCallExpr.Method.DeclaringType != typeof(Arg),
                        Error.UnexpectedExpressionInsteadOfArgMethod, methodCallExpr);

                    if (methodCallExpr.Method.Name == Arg.ArgIndexMethodName)
                    {
                        var getArgValue = GetArgCustomValueProvider(methodCallExpr, argValues);
                        parameters = parameters.Details((r, p) => p.Equals(parameter)
                            ? ServiceDetails.Of(getArgValue(r))
                            : null);
                    }
                    else // handle service details
                    {
                        var defaultValue = parameter.IsOptional ? parameter.DefaultValue : null;
                        var argDetails = GetArgServiceDetails(methodCallExpr, parameter.ParameterType, IfUnresolved.Throw, defaultValue);
                        parameters = parameters.Details((r, p) => p.Equals(parameter) ? argDetails : null);
                    }
                }
                else
                {
                    GetArgConstantExpressionOrDefault(argExprs[i])
                        .ThrowIfNull(Error.UnexpectedExpressionInsteadOfConstant, argExprs[i]);
                }
            }
            return parameters;
        }

        private static PropertiesAndFieldsSelector ComposePropertiesAndFieldsSelector(
            IList<MemberBinding> memberBindings, params Func<Request, object>[] argValues)
        {
            var propertiesAndFields = DryIoc.PropertiesAndFields.Of;
            for (var i = 0; i < memberBindings.Count; i++)
            {
                var memberAssignment = (memberBindings[i] as MemberAssignment).ThrowIfNull();
                var member = memberAssignment.Member;

                var methodCallExpr = memberAssignment.Expression as MethodCallExpression;
                if (methodCallExpr == null)
                {
                    var memberDefaultExpr = GetArgConstantExpressionOrDefault(memberAssignment.Expression);
                    memberDefaultExpr.ThrowIfNull(Error.UnexpectedExpressionInsteadOfConstant, memberAssignment.Expression);
                    propertiesAndFields = propertiesAndFields.And(r => new[]
                    {
                        PropertyOrFieldServiceInfo.Of(member)
                    });
                }
                else
                {
                    Throw.If(methodCallExpr.Method.DeclaringType != typeof(Arg),
                        Error.UnexpectedExpressionInsteadOfArgMethod, methodCallExpr);

                    if (methodCallExpr.Method.Name == Arg.ArgIndexMethodName) // handle custom value
                    {
                        var getArgValue = GetArgCustomValueProvider(methodCallExpr, argValues);
                        propertiesAndFields = propertiesAndFields.And(r => new[]
                        {
                            PropertyOrFieldServiceInfo.Of(member).WithDetails(ServiceDetails.Of(getArgValue(r)), r)
                        });
                    }
                    else
                    {
                        var memberType = member.GetReturnTypeOrDefault();
                        var argServiceDetails = GetArgServiceDetails(methodCallExpr, memberType, IfUnresolved.ReturnDefault, null);
                        propertiesAndFields = propertiesAndFields.And(r => new[]
                        {
                            PropertyOrFieldServiceInfo.Of(member).WithDetails(argServiceDetails, r)
                        });
                    }
                }
            }
            return propertiesAndFields;
        }

        private static Func<Request, object> GetArgCustomValueProvider(MethodCallExpression methodCallExpr, Func<Request, object>[] argValues)
        {
            Throw.If(argValues.IsNullOrEmpty(), Error.ArgOfValueIsProvidedButNoArgValues);

            var argIndexExpr = methodCallExpr.Arguments[0];
            var argIndexValueExpr = GetArgConstantExpressionOrDefault(argIndexExpr);
            var argIndex = (int)argIndexValueExpr.Value;

            Throw.If(argIndex < 0 || argIndex >= argValues.Length,
                Error.ArgOfValueIndesIsOutOfProvidedArgValues, argIndex, argValues);

            var getArgValue = argValues[argIndex];
            return getArgValue;
        }

        private static ServiceDetails GetArgServiceDetails(MethodCallExpression methodCallExpr,
            Type dependencyType, IfUnresolved defaultIfUnresolved, object defaultValue)
        {
            var requiredServiceType = methodCallExpr.Method.GetGenericArguments().Last();
            if (requiredServiceType == dependencyType)
                requiredServiceType = null;

            var serviceKey = default(object);
            var ifUnresolved = defaultIfUnresolved;

            var argExpr = methodCallExpr.Arguments;
            for (var j = 0; j < argExpr.Count; j++)
            {
                var argValueExpr = GetArgConstantExpressionOrDefault(argExpr[j]);
                if (argValueExpr != null)
                {
                    if (argValueExpr.Type == typeof(IfUnresolved))
                        ifUnresolved = (IfUnresolved)argValueExpr.Value;
                    else // service key
                        serviceKey = argValueExpr.Value;
                }
            }

            defaultValue = ifUnresolved == IfUnresolved.ReturnDefault ? defaultValue : null;
            return ServiceDetails.Of(requiredServiceType, serviceKey, ifUnresolved, defaultValue);
        }

        private static ConstantExpression GetArgConstantExpressionOrDefault(Expression arg)
        {
            var valueExpr = arg as ConstantExpression;
            if (valueExpr != null)
                return valueExpr;
            var convert = arg as UnaryExpression; // e.g. (object)SomeEnum.Value
            if (convert != null && convert.NodeType == ExpressionType.Convert)
                valueExpr = convert.Operand as ConstantExpression;
            return valueExpr;
        }

        #endregion
    }
}