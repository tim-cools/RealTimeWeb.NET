using System;
using System.Collections.Generic;

namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    /// <summary>Defines error codes and error messages for all DryIoc exceptions (DryIoc extensions may define their own.)</summary>
    public static class Error
    {
        /// <summary>First error code to identify error range for other possible error code definitions.</summary>
        public readonly static int FirstErrorCode = 0;

        /// <summary>List of error messages indexed with code.</summary>
        public readonly static List<string> Messages = new List<string>(100);

#pragma warning disable 1591 // "Missing XML-comment"
        public static readonly int
            InvalidCondition = Of("Argument {0} of type {1} has invalid condition."),
            IsNull = Of("Argument of type {0} is null."),
            IsNotOfType = Of("Argument {0} is not of type {1}."),
            TypeIsNotOfType = Of("Type argument {0} is not assignable from type {1}."),

            UnableToResolveUnknownService = Of(
                "Unable to resolve {0}." + Environment.NewLine +
                "Where no service registrations found" + Environment.NewLine +
                "  and number of Rules.FallbackContainers: {1}" + Environment.NewLine +
                "  and number of Rules.UnknownServiceResolvers: {2}"),

            UnableToResolveFromRegisteredServices = Of(
                "Unable to resolve {0}" + Environment.NewLine +
                "Where CurrentScope: {1}" + Environment.NewLine +
                "  and ResolutionScope: {2}" + Environment.NewLine +
                "  and Found registrations:" + Environment.NewLine + "{3}"),

            ExpectedSingleDefaultFactory = Of(
                "Expecting single default registration of {0} but found many:" + Environment.NewLine + "{1}." + Environment.NewLine +
                "Please identify service with key, or metadata, or use Rules.WithFactorySelector to specify single registered factory."),
            RegisterImplementationNotAssignableToServiceType = Of(
                "Registering implementation type {0} not assignable to service type {1}."),
            RegisteredFactoryMethodResultTypesIsNotAssignableToImplementationType = Of(
                "Registered factory method return type {1} should be assignable to implementation type {0} but it is not."),
            RegisteringOpenGenericRequiresFactoryProvider = Of(
                "Unable to register not a factory provider for open-generic service {0}."),
            RegisteringOpenGenericImplWithNonGenericService = Of(
                "Unable to register open-generic implementation {0} with non-generic service {1}."),
            RegisteringOpenGenericServiceWithMissingTypeArgs = Of(
                "Unable to register open-generic implementation {0} because service {1} should specify all type arguments, but specifies only {2}."),
            RegisteringNotAGenericTypedefImplType = Of(
                "Unsupported registration of implementation {0} which is not a generic type definition but contains generic parameters." + Environment.NewLine +
                "Consider to register generic type definition {1} instead."),
            RegisteringNotAGenericTypedefServiceType = Of(
                "Unsupported registration of service {0} which is not a generic type definition but contains generic parameters." + Environment.NewLine +
                "Consider to register generic type definition {1} instead."),
            RegisteringNullImplementationTypeAndNoFactoryMethod = Of(
                "Registering without implementation type and without FactoryMethod to use instead."),
            RegisteringAbstractImplementationTypeAndNoFactoryMethod = Of(
                "Registering abstract implementation type {0} when it is should be concrete. Also there is not FactoryMethod to use instead."),
            NoPublicConstructorDefined = Of(
                "There is no public constructor defined for {0}."),
            NoDefinedMethodToSelectFromMultipleConstructors = Of(
                "Unspecified how to select single constructor for implementation type {0} with {1} public constructors."),
            NoMatchedImplementedTypesWithServiceType = Of(
                "Unable to match service with open-generic {0} implementing {1} when resolving {2}."),
            NoMatchedFactoryMethodDeclaringTypeWithServiceTypeArgs = Of(
                "Unable to match open-generic factory method Declaring type {0} with requested service type arguments <{1}> when resolving {2}."),
            NoMatchedFactoryMethodWithServiceTypeArgs = Of(
                "Unable to match open-generic factory method {0} with requested service type arguments <{1}> when resolving {2}."),
            OpenGenericFactoryMethodDeclaringTypeIsNotSupportedOnThisPlatform = Of(
                "[Specific to this .NET version] Unable to match method or constructor {0} from open-generic declaring type {1} to closed-generic type {2}, " + Environment.NewLine +
                "Please give thje method an unique name to distinguish it from other overloads."),
            CtorIsMissingSomeParameters = Of(
                "Constructor [{0}] of {1} misses some arguments required for {2} dependency."),
            UnableToSelectConstructor = Of(
                "Unable to select single constructor from {0} available in {1}." + Environment.NewLine
                + "Please provide constructor selector when registering service."),
            ExpectedFuncWithMultipleArgs = Of(
                "Expecting Func with one or more arguments but found {0}."),
            ResolvingOpenGenericServiceTypeIsNotPossible = Of(
                "Resolving open-generic service type is not possible for type: {0}."),
            RecursiveDependencyDetected = Of(
                "Recursive dependency is detected when resolving" + Environment.NewLine + "{0}."),
            ScopeIsDisposed = Of(
                "Scope is disposed and scoped instances are no longer available."),
            NotFoundOpenGenericImplTypeArgInService = Of(
                "Unable to find for open-generic implementation {0} the type argument {1} when resolving {2}."),
            UnableToGetConstructorFromSelector = Of(
                "Unable to get constructor of {0} using provided constructor selector."),
            UnableToFindCtorWithAllResolvableArgs = Of(
                "Unable to find constructor with all resolvable parameters when resolving {0}."),
            UnableToFindMatchingCtorForFuncWithArgs = Of(
                "Unable to find constructor with all parameters matching Func signature {0} " + Environment.NewLine
                + "and the rest of parameters resolvable from Container when resolving: {1}."),
            RegedFactoryDlgResultNotOfServiceType = Of(
                "Registered factory delegate returns service {0} is not assignable to {2}."),
            NotFoundSpecifiedWritablePropertyOrField = Of(
                "Unable to find writable property or field \"{0}\" when resolving: {1}."),
            PushingToRequestWithoutFactory = Of(
                "Pushing next info {0} to request not yet resolved to factory: {1}"),
            TargetWasAlreadyDisposed = Of(
                "Target {0} was already disposed in {1} wrapper."),
            NoMatchedGenericParamConstraints = Of(
                "Open-generic service does not match with registered open-generic implementation constraints {0} when resolving: {1}."),
            GenericWrapperWithMultipleTypeArgsShouldSpecifyArgIndex = Of(
                "Generic wrapper type {0} should specify what type arg is wrapped, but it does not."),
            GenericWrapperTypeArgIndexOutOfBounds = Of(
                "Registered generic wrapper {0} specified type argument index {1} is out of type argument list."),
            DependencyHasShorterReuseLifespan = Of(
                "Dependency {0} has shorter Reuse lifespan than its parent: {1}." + Environment.NewLine +
                "{2} lifetime is shorter than {3}." + Environment.NewLine +
                "You may turn Off this error with new Container(rules => rules.WithoutThrowIfDependencyHasShorterReuseLifespan())."),
            WeakRefReuseWrapperGCed = Of(
                "Reused service wrapped in WeakReference is Garbage Collected and no longer available."),
            ServiceIsNotAssignableFromFactoryMethod = Of(
                "Service of {0} is not assignable from factory method {1} when resolving: {2}."),
            ServiceIsNotAssignableFromOpenGenericRequiredServiceType = Of(
                "Service of {0} is not assignable from open-generic required service type {1} when resolving: {2}."),
            FactoryObjIsNullInFactoryMethod = Of(
                "Unable to use null factory object with factory method {0} when resolving: {1}."),
            FactoryObjProvidedButMethodIsStatic = Of(
                "Factory instance provided {0} But factory method is static {1} when resolving: {2}."),
            GotNullConstructorFromFactoryMethod = Of(
                "Got null constructor when resolving {0}"),
            NoOpenThreadScope = Of(
                "Unable to find open thread scope in {0}. Please OpenScope with {0} to make sure thread reuse work."),
            ContainerIsGarbageCollected = Of(
                "Container is no longer available (has been garbage-collected)."),
            UnableToResolveDecorator = Of(
                "Unable to resolve decorator {0}."),
            UnableToRegisterDuplicateDefault = Of(
                "Service {0} without key is already registered as {2}."),
            UnableToRegisterDuplicateKey = Of(
                "Unable to register service {0} - {1} with duplicate key [{2}] " + Environment.NewLine +
                " Already registered service with the same key is {3}."),
            NoCurrentScope = Of(
                "No current scope available: probably you are registering to, or resolving from outside of scope."),
            ContainerIsDisposed = Of(
                "Container is disposed and its operations are no longer available."),
            NotDirectScopeParent = Of(
                "Unable to OpenScope [{0}] because parent scope [{1}] is not current context scope [{2}]." + Environment.NewLine +
                "It is probably other scope was opened in between OR you forgot to Dispose some other scope!"),
            WrappedNotAssignableFromRequiredType = Of(
                "Service (wrapped) type {0} is not assignable from required service type {1} when resolving {2}."),
            NoMatchedScopeFound = Of(
                "Unable to find scope with matching name: {0}."),
            UnableToNewOpenGeneric = Of(
                "Unable to New not concrete/open-generic type {0}."),
            NoMatchingScopeWhenRegisteringInstance = Of(
                "No matching scope when registering instance [{0}] with {1}." + Environment.NewLine +
                "You could register delegate returning instance instead. That will succeed as long as scope is available at resolution."),
            ResolutionScopeIsNotSupportedForRegisterInstance = Of(
                "ResolutionScope reuse is not supported for registering instance: {0}"),
            NotSupportedMadeExpression = Of(
                "Only expression of method call, property getter, or new statement (with optional property initializer) is supported, but found: {0}."),
            UnexpectedFactoryMemberExpression = Of(
                "Expected property getter, but found {0}."),
            UnexpectedExpressionInsteadOfArgMethod = Of(
                "Expected DryIoc.Arg method call to specify parameter/property/field, but found: {0}."),
            UnexpectedExpressionInsteadOfConstant = Of(
                "Expected constant expression to specify parameter/property/field, but found something else: {0}."),
            InjectedCustomValueIsOfDifferentType = Of(
                "Injected value {0} is not assignable to {2}."),
            StateIsRequiredToUseItem = Of(
                "State is required to use (probably to inject) item {0}."),
            ArgOfValueIsProvidedButNoArgValues = Of(
                "Arg.OfValue index is provided but no arg values specified."),
            ArgOfValueIndesIsOutOfProvidedArgValues = Of(
                "Arg.OfValue index {0} is outside of provided value factories: {1}"),
            ResolutionNeedsRequiredServiceType = Of(
                "Expecting required service type but it is not specified when resolving: {0}"),
            RegisterMappingNotFoundRegisteredService = Of(
                "When registering mapping unable to find factory of registered service type {0} and key {1}."),
            RegisteringInstanceNotAssignableToServiceType = Of(
                "Registered instance {0} is not assignable to serviceType {1}."),
            RegisteredInstanceIsNotAvailableInCurrentContext = Of(
                "Registered instance of {0} is not available in a given context." + Environment.NewLine +
                "It may mean that instance is requested from fallback container which is not supported at the moment."),
            RegisteringWithNotSupportedDepedendencyCustomValueType = Of(
                "Registering {0} dependency with not supported custom value type {1}." + Environment.NewLine + 
                "Only DryIoc.DefaultValue, System.Type, .NET primitives types, or array of those are supported.");

#pragma warning restore 1591 // "Missing XML-comment"

        /// <summary>Stores new error message and returns error code for it.</summary>
        /// <param name="message">Error message to store.</param> <returns>Error code for message.</returns>
        public static int Of(string message)
        {
            Messages.Add(message);
            return FirstErrorCode + Messages.Count - 1;
        }
    }
}