using System;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Text;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    /// <summary>Wraps constructor or factory method optionally with factory instance to create service.</summary>
    public sealed class FactoryMethod
    {
        /// <summary>Constructor or method to use for service creation.</summary>
        public readonly MemberInfo ConstructorOrMethodOrMember;

        /// <summary>Identifies factory service if factory method is instance member.</summary>
        public readonly ServiceInfo FactoryServiceInfo;

        /// <summary>Wraps method and factory instance.</summary>
        /// <param name="ctorOrMethodOrMember">Constructor, static or instance method, property or field.</param>
        /// <param name="factoryInfo">Factory info to resolve in case of instance <paramref name="ctorOrMethodOrMember"/>.</param>
        /// <returns>New factory method wrapper.</returns>
        public static FactoryMethod Of(MemberInfo ctorOrMethodOrMember, ServiceInfo factoryInfo = null)
        {
            return new FactoryMethod(ctorOrMethodOrMember, factoryInfo);
        }

        /// <summary>Pretty prints wrapped method.</summary> <returns>Printed string.</returns>
        public override string ToString()
        {
            return new StringBuilder().Print(ConstructorOrMethodOrMember.DeclaringType)
                .Append("::").Append(ConstructorOrMethodOrMember).ToString();
        }

        /// <summary>Searches for constructor with all resolvable parameters or throws <see cref="ContainerException"/> if not found.
        /// Works both for resolving as service and as Func of TArgs... returning TService.</summary>
        public static readonly FactoryMethodSelector ConstructorWithResolvableArguments = request =>
        {
            var implementationType = request.ImplementationType.ThrowIfNull();
            var ctors = implementationType.GetAllConstructors().ToArrayOrSelf();
            if (ctors.Length == 0)
                return null; // Delegate handling of constructor absence to caller code.
            if (ctors.Length == 1)
                return Of(ctors[0]);

            var ctorsWithMoreParamsFirst = ctors
                .Select(c => new { Ctor = c, Params = c.GetParameters() })
                .OrderByDescending(x => x.Params.Length);

            var factory = (request.ResolvedFactory as ReflectionFactory).ThrowIfNull();
            var parameterSelector = request.Container.Rules.Parameters.And(factory.Made.Parameters)(request);

            if (request.IsNestedInFuncWithArgs())
            {
                // For Func with arguments, match constructor should contain all input arguments and the rest should be resolvable.
                var funcType = request.Parent.ServiceType;
                var funcArgs = funcType.GetGenericParamsAndArgs();
                var inputArgCount = funcArgs.Length - 1;

                var matchedCtor = ctorsWithMoreParamsFirst
                    .Where(x => x.Params.Length >= inputArgCount)
                    .FirstOrDefault(x =>
                    {
                        var matchedIndecesMask = 0;
                        return x.Params.Except(
                            x.Params.Where(p =>
                            {
                                var inputArgIndex = funcArgs.IndexOf(p.ParameterType);
                                if (inputArgIndex == -1 || inputArgIndex == inputArgCount ||
                                    (matchedIndecesMask & inputArgIndex << 1) != 0)
                                    // input argument was already matched by another parameter
                                    return false;
                                matchedIndecesMask |= inputArgIndex << 1;
                                return true;
                            })).All(p => ResolveParameter(p, parameterSelector, request) != null);
                    });

                var ctor = matchedCtor.ThrowIfNull(Error.UnableToFindMatchingCtorForFuncWithArgs, funcType, request).Ctor;
                return Of(ctor);
            }
            else
            {
                var matchedCtor = ctorsWithMoreParamsFirst.FirstOrDefault(x =>
                    x.Params.All(p => ResolveParameter(p, parameterSelector, request) != null));
                var ctor = matchedCtor.ThrowIfNull(Error.UnableToFindCtorWithAllResolvableArgs, request).Ctor;
                return Of(ctor);
            }
        };

        private static Expression ResolveParameter(ParameterInfo parameter,
            Func<ParameterInfo, ParameterServiceInfo> parameterSelector, Request request)
        {
            var parameterServiceInfo = parameterSelector(parameter) ?? ParameterServiceInfo.Of(parameter);
            var parameterRequest = request.Push(parameterServiceInfo.WithDetails(ServiceDetails.IfUnresolvedReturnDefault, request));
            var parameterFactory = request.Container.ResolveFactory(parameterRequest);
            return parameterFactory == null ? null : parameterFactory.GetExpressionOrDefault(parameterRequest);
        }

        private FactoryMethod(MemberInfo constructorOrMethodOrMember, ServiceInfo factoryServiceInfo = null)
        {
            ConstructorOrMethodOrMember = constructorOrMethodOrMember;
            FactoryServiceInfo = factoryServiceInfo;
        }
    }
}