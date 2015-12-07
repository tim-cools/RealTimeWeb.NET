using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;

namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    /// <summary>Contains resolution stack with information about resolved service and factory for it,
    /// Additionally request contain weak reference to <see cref="IContainer"/>. That the all required information for resolving services.
    /// Request implements <see cref="IResolver"/> interface on top of provided container, which could be use by delegate factories.</summary>
    public sealed class Request
    {
        /// <summary>Creates empty request associated with provided <paramref name="container"/>.
        /// Every resolution will start from this request by pushing service information into, and then resolving it.</summary>
        /// <param name="container">Reference to container issued the request. Could be changed later with <see cref="WithNewContainer"/> method.</param>
        /// <returns>New empty request.</returns>
        public static Request CreateEmpty(ContainerWeakRef container)
        {
            return new Request(null, container, container, null, null);
        }

        /// <summary>Indicates that request is empty initial request: there is no <see cref="ServiceInfo"/> in such a request.</summary>
        public bool IsEmpty { get { return ServiceInfo == null; } }

        /// <summary>Previous request in dependency chain. It <see cref="IsEmpty"/> for resolution root.</summary>
        public readonly Request Parent;

        /// <summary>Requested service id info and commanded resolution behavior.</summary>
        public IServiceInfo ServiceInfo { get; private set; }

        /// <summary>Factory found in container to resolve this request.</summary>
        public readonly Factory ResolvedFactory;

        /// <summary>User provided arguments: key tracks what args are still unused.</summary>
        public readonly KV<bool[], ParameterExpression[]> FuncArgs;

        /// <summary>Weak reference to container.</summary>
        public readonly ContainerWeakRef ContainerWeakRef;
        private readonly ContainerWeakRef _scopesWeakRef;

        /// <summary>Provides access to container currently bound to request. 
        /// By default it is container initiated request by calling resolve method,
        /// but could be changed along the way: for instance when resolving from parent container.</summary>
        public IContainer Container { get { return ContainerWeakRef.Container; } }

        /// <summary>Separate access to scopes.</summary>
        public IScopeAccess Scopes { get { return _scopesWeakRef.Scopes; } }

        /// <summary>Shortcut access to <see cref="IServiceInfo.ServiceType"/>.</summary>
        public Type ServiceType { get { return ServiceInfo == null ? null : ServiceInfo.ServiceType; } }

        /// <summary>Shortcut access to <see cref="ServiceDetails.ServiceKey"/>.</summary>
        public object ServiceKey { get { return ServiceInfo.ThrowIfNull().Details.ServiceKey; } }

        /// <summary>Shortcut access to <see cref="ServiceDetails.IfUnresolved"/>.</summary>
        public IfUnresolved IfUnresolved { get { return ServiceInfo.ThrowIfNull().Details.IfUnresolved; } }

        /// <summary>Shortcut access to <see cref="ServiceDetails.RequiredServiceType"/>.</summary>
        public Type RequiredServiceType { get { return ServiceInfo.ThrowIfNull().Details.RequiredServiceType; } }

        /// <summary>Implementation type of factory, if request was <see cref="WithResolvedFactory"/> factory, or null otherwise.</summary>
        public Type ImplementationType { get { return ResolvedFactory == null ? null : ResolvedFactory.ImplementationType; } }

        /// <summary>Shortcut to FactoryType.</summary>
        public FactoryType ResolvedFactoryType { get { return ResolvedFactory == null ? FactoryType.Service : ResolvedFactory.FactoryType; } }

        /// <summary>Resolution scope.</summary>
        public readonly IScope Scope;

        /// <summary>Returns true if request originated from first Resolve call.</summary>
        public bool IsCompositionRoot { get { return Scope == null; } }

        /// <summary>Creates new request with provided info, and attaches current request as new request parent.</summary>
        /// <param name="info">Info about service to resolve.</param> <param name="scope">(optional) Resolution scope.</param>
        /// <returns>New request for provided info.</returns>
        /// <remarks>Current request should be resolved to factory (<see cref="WithResolvedFactory"/>), before pushing info into it.</remarks>
        public Request Push(IServiceInfo info, IScope scope = null)
        {
            if (IsEmpty)
                return new Request(this, ContainerWeakRef, _scopesWeakRef, info.ThrowIfNull(), null, null,
                    scope /* input scope provided only for first request when Resolve called */);

            ResolvedFactory.ThrowIfNull(Error.PushingToRequestWithoutFactory, info.ThrowIfNull(), this);
            var inheritedInfo = info.InheritInfoFromDependencyOwner(ServiceInfo, ResolvedFactory.Setup.FactoryType != FactoryType.Service);
            return new Request(this, ContainerWeakRef, _scopesWeakRef, inheritedInfo, null, FuncArgs,
                Scope /* then scope is copied into dependency requests */);
        }

        /// <summary>Composes service description into <see cref="IServiceInfo"/> and calls Push.</summary>
        /// <param name="serviceType">Service type to resolve.</param>
        /// <param name="serviceKey">(optional) Service key to resolve.</param>
        /// <param name="ifUnresolved">(optional) Instructs how to handle unresolved service.</param>
        /// <param name="requiredServiceType">(optional) Registered/unwrapped service type to find.</param>
        /// <param name="scope">(optional) Resolution scope.</param>
        /// <returns>New request with provided info.</returns>
        public Request Push(Type serviceType,
            object serviceKey = null, IfUnresolved ifUnresolved = IfUnresolved.Throw, Type requiredServiceType = null,
            IScope scope = null)
        {
            serviceType.ThrowIfNull().ThrowIf(serviceType.IsOpenGeneric(), Error.ResolvingOpenGenericServiceTypeIsNotPossible);
            var details = ServiceDetails.Of(requiredServiceType, serviceKey, ifUnresolved);
            return Push(DryIoc.ServiceInfo.Of(serviceType).WithDetails(details, this), scope ?? Scope);
        }

        /// <summary>Allow to switch current service info to new one: for instance it is used be decorators.</summary>
        /// <param name="getInfo">Gets new info to switch to.</param>
        /// <returns>New request with new info but the rest intact: e.g. <see cref="ResolvedFactory"/>.</returns>
        public Request WithChangedServiceInfo(Func<IServiceInfo, IServiceInfo> getInfo)
        {
            return new Request(Parent, ContainerWeakRef, _scopesWeakRef, getInfo(ServiceInfo), ResolvedFactory, FuncArgs, Scope);
        }

        /// <summary>Sets service key to passed value. Required for multiple default services to change null key to
        /// actual <see cref="DefaultKey"/></summary>
        /// <param name="serviceKey">Key to set.</param>
        public void ChangeServiceKey(object serviceKey) // NOTE: May be removed in future versions. 
        {
            var details = ServiceInfo.Details;
            ServiceInfo = ServiceInfo.Create(ServiceInfo.ServiceType,
                ServiceDetails.Of(details.RequiredServiceType, serviceKey, details.IfUnresolved, details.DefaultValue));
        }

        /// <summary>Returns new request with parameter expressions created for <paramref name="funcType"/> input arguments.
        /// The expression is set to <see cref="FuncArgs"/> request field to use for <see cref="WrappersSupport.FuncTypes"/>
        /// resolution.</summary>
        /// <param name="funcType">Func type to get input arguments from.</param>
        /// <param name="funcArgPrefix">(optional) Unique prefix to help generate non-conflicting argument names.</param>
        /// <returns>New request with <see cref="FuncArgs"/> field set.</returns>
        public Request WithFuncArgs(Type funcType, string funcArgPrefix = null)
        {
            var funcArgs = funcType.ThrowIf(!funcType.IsFuncWithArgs()).GetGenericParamsAndArgs();
            var funcArgExprs = new ParameterExpression[funcArgs.Length - 1];

            for (var i = 0; i < funcArgExprs.Length; ++i)
            {
                var funcArg = funcArgs[i];
                var prefix = funcArgPrefix == null ? "_" : "_" + funcArgPrefix + "_";
                var funcArgName = prefix + funcArg.Name + i; // Valid non conflicting argument names for code generation
                funcArgExprs[i] = Expression.Parameter(funcArg, funcArgName);
            }

            var funcArgsUsage = new bool[funcArgExprs.Length];
            var funcArgsUsageAndExpr = new KV<bool[], ParameterExpression[]>(funcArgsUsage, funcArgExprs);
            return new Request(Parent, ContainerWeakRef, _scopesWeakRef, ServiceInfo, ResolvedFactory, funcArgsUsageAndExpr, Scope);
        }

        /// <summary>Changes container to passed one. Could be used by child container, 
        /// to switch child container to parent preserving the rest of request state.</summary>
        /// <param name="newContainer">Reference to container to switch to.</param>
        /// <returns>Request with replaced container.</returns>
        public Request WithNewContainer(ContainerWeakRef newContainer)
        {
            return new Request(Parent, newContainer, _scopesWeakRef, ServiceInfo, ResolvedFactory, FuncArgs, Scope);
        }

        /// <summary>Returns new request with set <see cref="ResolvedFactory"/>.</summary>
        /// <param name="factory">Factory to which request is resolved.</param>
        /// <returns>New request with set factory.</returns>
        public Request WithResolvedFactory(Factory factory)
        {
            if (IsEmpty || (ResolvedFactory != null && ResolvedFactory.FactoryID == factory.FactoryID))
                return this; // resolving only once, no need to check recursion again.

            if (factory.FactoryType == FactoryType.Service)
                for (var p = Parent; !p.IsEmpty; p = p.Parent)
                    Throw.If(p.ResolvedFactory.FactoryID == factory.FactoryID,
                        Error.RecursiveDependencyDetected, Print(factory.FactoryID));

            return new Request(Parent, ContainerWeakRef, _scopesWeakRef, ServiceInfo, factory, FuncArgs, Scope);
        }

        /// <summary>Searches parent request stack upward and returns closest parent of <see cref="FactoryType.Service"/>.
        /// If not found returns <see cref="IsEmpty"/> request.</summary> <returns>Found parent or <see cref="IsEmpty"/> request.</returns>
        public Request ParentNonWrapper()
        {
            var p = Parent;
            while (!p.IsEmpty && p.ResolvedFactory.FactoryType == FactoryType.Wrapper)
                p = p.Parent;
            return p;
        }

        /// <summary>Searches parent request stack upward and returns closest parent of <see cref="FactoryType.Service"/>.
        /// If not found returns <see cref="IsEmpty"/> request.</summary>
        /// <param name="condition">Condition, e.g. to find root request condition may be: <code lang="cs"><![CDATA[p => p.Parent.IsEmpty]]></code></param>
        /// <returns>Found parent or empty request.</returns>
        public Request ParentNonWrapper(Func<Request, bool> condition)
        {
            var p = Parent;
            while (!p.IsEmpty && (p.ResolvedFactory.FactoryType == FactoryType.Wrapper || !condition(p)))
                p = p.Parent;
            return p;
        }

        /// <summary>Enumerates all request stack parents. Last returned will <see cref="IsEmpty"/> empty parent.</summary>
        /// <returns>Unfolding parents.</returns>
        public IEnumerable<Request> Enumerate()
        {
            for (var r = this; !r.IsEmpty; r = r.Parent)
                yield return r;
        }

        /// <summary>Prints current request info only (no parents printed) to provided builder.</summary>
        /// <param name="s">Builder to print too.</param>
        /// <returns>(optional) Builder to appended info to, or new builder if not specified.</returns>
        public StringBuilder PrintCurrent(StringBuilder s = null)
        {
            s = s ?? new StringBuilder();
            if (IsEmpty) return s.Append("{root}");
            if (ResolvedFactory != null && ResolvedFactory.FactoryType != FactoryType.Service)
                s.Append(ResolvedFactory.FactoryType.ToString().ToLower()).Append(' ');
            if (FuncArgs != null)
                s.AppendFormat("with {0} arg(s) ", FuncArgs.Key.Count(k => k == false));
            if (ImplementationType != null && ImplementationType != ServiceType)
                s.Print(ImplementationType).Append(": ");
            return s.Append(ServiceInfo);
        }

        /// <summary>Prints full stack of requests starting from current one using <see cref="PrintCurrent"/>.</summary>
        /// <param name="recursiveFactoryID">Flag specifying that in case of found recursion/repetition of requests, 
        /// mark repeated requests.</param>
        /// <returns>Builder with appended request stack info.</returns>
        public StringBuilder Print(int recursiveFactoryID = -1)
        {
            var sb = PrintCurrent(new StringBuilder());
            if (Parent == null)
                return sb;

            sb = recursiveFactoryID == -1 ? sb : sb.Append(" <--recursive");
            foreach (var r in Parent.Enumerate())
            {
                sb = r.PrintCurrent(sb.AppendLine().Append("  in "));
                if (r.ResolvedFactory.FactoryID == recursiveFactoryID)
                    sb = sb.Append(" <--recursive");
            }

            return sb;
        }

        /// <summary>Print while request stack info to string using <seealso cref="Print"/>.</summary>
        /// <returns>String with info.</returns>
        public override string ToString()
        {
            return Print().ToString();
        }

        #region Implementation

        internal Request(Request parent,
            ContainerWeakRef containerWeakRef, ContainerWeakRef scopesWeakRef,
            IServiceInfo serviceInfo, Factory resolvedFactory,
            KV<bool[], ParameterExpression[]> funcArgs = null, IScope scope = null)
        {
            Parent = parent;
            ContainerWeakRef = containerWeakRef;
            _scopesWeakRef = scopesWeakRef;
            ServiceInfo = serviceInfo;
            ResolvedFactory = resolvedFactory;
            FuncArgs = funcArgs;
            Scope = scope;
        }

        #endregion
    }
}