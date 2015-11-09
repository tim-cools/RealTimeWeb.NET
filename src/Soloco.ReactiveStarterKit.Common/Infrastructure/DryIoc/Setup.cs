using System;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    /// <summary>Base class to store optional <see cref="Factory"/> settings.</summary>
    public abstract class Setup
    {
        /// <summary>Factory type is required to be specified by concrete setups as in 
        /// <see cref="ServiceSetup"/>, <see cref="DecoratorSetup"/>, <see cref="WrapperSetup"/>.</summary>
        public abstract FactoryType FactoryType { get; }

        /// <summary>Predicate to check if factory could be used for resolved request.</summary>
        public virtual Func<Request, bool> Condition { get; private set; }

        /// <summary>Set to true allows to cache and use cached factored service expression.</summary>
        public virtual bool CacheFactoryExpression { get { return false; } }

        /// <summary>Arbitrary metadata object associated with Factory/Implementation.</summary>
        public virtual object Metadata { get { return null; } }

        /// <summary>Indicates that injected expression should be: 
        /// <c><![CDATA[r.Resolver.Resolve<IDependency>(...)]]></c>
        /// instead of: <c><![CDATA[new Dependency(...)]]></c></summary>
        public virtual bool AsResolutionRoot { get { return false; } }

        /// <summary>In addition to <see cref="AsResolutionRoot"/> opens scope.</summary>
        public virtual bool OpenResolutionScope { get { return false; } }

        /// <summary>Prevents disposal of reused instance if it is disposable.</summary>
        public virtual bool PreventDisposal { get { return false; } }

        /// <summary>Stores reused instance as WeakReference.</summary>
        public virtual bool WeaklyReferenced { get { return false; } }

        /// <summary>Default setup for service factories.</summary>
        public static readonly Setup Default = new ServiceSetup();

        /// <summary>Constructs setup object out of specified settings. If all settings are default then <see cref="Setup.Default"/> setup will be returned.</summary>
        /// <param name="cacheFactoryExpression">(optional)</param> <param name="lazyMetadata">(optional)</param> 
        /// <param name="metadata">(optional) Overrides <paramref name="lazyMetadata"/></param> <param name="condition">(optional)</param>
        /// <param name="openResolutionScope">(optional) Same as <paramref name="asResolutionRoot"/> but in addition opens new scope.</param>
        /// <param name="asResolutionRoot">(optional) If true dependency expression will be "r.Resolve(...)" instead of inline expression.</param>
        /// <param name="preventDisposal">(optional) Prevents disposal of reused instance if it is disposable.</param>
        /// <param name="weaklyReferenced">(optional) Stores reused instance as WeakReference.</param>
        /// <returns>New setup object or <see cref="Setup.Default"/>.</returns>
        public static Setup With(bool cacheFactoryExpression = true,
            Func<object> lazyMetadata = null, object metadata = null,
            Func<Request, bool> condition = null,
            bool openResolutionScope = false, bool asResolutionRoot = false,
            bool preventDisposal = false, bool weaklyReferenced = false)
        {
            if (cacheFactoryExpression &&
                lazyMetadata == null && metadata == null &&
                condition == null &&
                openResolutionScope == false && asResolutionRoot == false &&
                preventDisposal == false && weaklyReferenced == false)
                return Default;

            return new ServiceSetup(cacheFactoryExpression,
                lazyMetadata, metadata,
                condition,
                openResolutionScope, asResolutionRoot,
                preventDisposal, weaklyReferenced);
        }

        /// <summary>Default setup which will look for wrapped service type as single generic parameter.</summary>
        public static readonly Setup Wrapper = new WrapperSetup();

        /// <summary>Returns generic wrapper setup.</summary>
        /// <param name="wrappedServiceTypeArgIndex">Default is -1 for generic wrapper with single type argument. Need to be set for multiple type arguments.</param> 
        /// <param name="alwaysWrapsRequiredServiceType">Need to be set when generic wrapper type arguments should be ignored.</param>
        /// <returns>New setup or default <see cref="Setup.Wrapper"/>.</returns>
        public static Setup WrapperWith(int wrappedServiceTypeArgIndex = -1, bool alwaysWrapsRequiredServiceType = false)
        {
            return wrappedServiceTypeArgIndex == -1 && !alwaysWrapsRequiredServiceType ? Wrapper
                : new WrapperSetup(wrappedServiceTypeArgIndex, alwaysWrapsRequiredServiceType);
        }

        /// <summary>Default decorator setup: decorator is applied to service type it registered with.</summary>
        public static readonly Setup Decorator = new DecoratorSetup();

        /// <summary>Creates setup with optional condition.</summary>
        /// <param name="condition">(optional)</param> <returns>New setup with condition or <see cref="Setup.Decorator"/>.</returns>
        public static Setup DecoratorWith(Func<Request, bool> condition = null)
        {
            return condition == null ? Decorator : new DecoratorSetup(condition);
        }

        private sealed class ServiceSetup : Setup
        {
            public override FactoryType FactoryType { get { return FactoryType.Service; } }

            public override bool CacheFactoryExpression { get { return _cacheFactoryExpression; } }

            public override object Metadata { get { return _metadata ?? (_metadata = _lazyMetadata == null ? null : _lazyMetadata()); } }

            public override bool AsResolutionRoot { get { return _isResolutionRoot || _openResolutionScope; } }
            public override bool OpenResolutionScope { get { return _openResolutionScope; } }

            public override bool PreventDisposal { get { return _preventDisposal; } }
            public override bool WeaklyReferenced { get { return _weaklyReferenced; } }

            public ServiceSetup(bool cacheFactoryExpression = true,
                Func<object> lazyMetadata = null, object metadata = null,
                Func<Request, bool> condition = null,
                bool openResolutionScope = false, bool isResolutionRoot = false,
                bool preventDisposal = false, bool weaklyReferenced = false)
            {
                _cacheFactoryExpression = cacheFactoryExpression;
                _lazyMetadata = lazyMetadata;
                _metadata = metadata;
                Condition = condition;
                _openResolutionScope = openResolutionScope;
                _isResolutionRoot = isResolutionRoot;
                _preventDisposal = preventDisposal;
                _weaklyReferenced = weaklyReferenced;
            }

            private readonly bool _cacheFactoryExpression;
            private readonly Func<object> _lazyMetadata;
            private object _metadata;
            private readonly bool _openResolutionScope;
            private readonly bool _isResolutionRoot;
            private readonly bool _preventDisposal;
            private readonly bool _weaklyReferenced;
        }

        /// <summary>Setup for <see cref="DryIoc.FactoryType.Wrapper"/> factory.</summary>
        public sealed class WrapperSetup : Setup
        {
            /// <summary>Returns <see cref="DryIoc.FactoryType.Wrapper"/> type.</summary>
            public override FactoryType FactoryType { get { return FactoryType.Wrapper; } }

            /// <summary>Delegate to get wrapped type from provided wrapper type. 
            /// If wrapper is generic, then wrapped type is usually a generic parameter.</summary>
            public readonly int WrappedServiceTypeArgIndex;

            /// <summary>Per name.</summary>
            public readonly bool AlwaysWrapsRequiredServiceType;

            /// <summary>Constructs wrapper setup from optional wrapped type selector and reuse wrapper factory.</summary>
            /// <param name="wrappedServiceTypeArgIndex">Default is -1 for generic wrapper with single type argument. Need to be set for multiple type arguments.</param> 
            /// <param name="alwaysWrapsRequiredServiceType">Need to be set when generic wrapper type arguments should be ignored.</param>
            public WrapperSetup(int wrappedServiceTypeArgIndex = -1, bool alwaysWrapsRequiredServiceType = false)
            {
                WrappedServiceTypeArgIndex = wrappedServiceTypeArgIndex;
                AlwaysWrapsRequiredServiceType = alwaysWrapsRequiredServiceType;
            }

            /// <summary>Unwraps service type or returns its.</summary>
            /// <param name="serviceType"></param> <returns>Wrapped type or self.</returns>
            public Type GetWrappedTypeOrNullIfWrapsRequired(Type serviceType)
            {
                if (AlwaysWrapsRequiredServiceType || !serviceType.IsGeneric())
                    return null;

                var typeArgs = serviceType.GetGenericParamsAndArgs();
                var typeArgIndex = WrappedServiceTypeArgIndex;
                serviceType.ThrowIf(typeArgs.Length > 1 && typeArgIndex == -1,
                    Error.GenericWrapperWithMultipleTypeArgsShouldSpecifyArgIndex);

                typeArgIndex = typeArgIndex != -1 ? typeArgIndex : 0;
                serviceType.ThrowIf(typeArgIndex > typeArgs.Length - 1,
                    Error.GenericWrapperTypeArgIndexOutOfBounds, typeArgIndex);

                return typeArgs[typeArgIndex];
            }
        }

        private sealed class DecoratorSetup : Setup
        {
            public override FactoryType FactoryType { get { return FactoryType.Decorator; } }

            public DecoratorSetup(Func<Request, bool> condition = null)
            {
                Condition = condition;
            }
        }
    }
}