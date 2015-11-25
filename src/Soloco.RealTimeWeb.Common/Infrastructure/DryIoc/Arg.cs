using System.Diagnostics.CodeAnalysis;

namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    /// <summary>Class for defining parameters/properties/fields service info in <see cref="Made"/> expressions.
    /// Its methods are NOT actually called, they just used to reflect service info from call expression.</summary>
    [SuppressMessage("ReSharper", "UnusedTypeParameter", Justification = "Type parameter is used by reflection.")]
    public static class Arg
    {
        /// <summary>Specifies required service type of parameter or member. If required type is the same as parameter/member type,
        /// the method is just a placeholder to help detect constructor or factory method, and does not have additional meaning.</summary>
        /// <typeparam name="TRequired">Required service type if different from parameter/member type.</typeparam>
        /// <returns>Returns some (ignored) value.</returns>
        public static TRequired Of<TRequired>() { return default(TRequired); }

        /// <summary>Specifies both service and required service types.</summary>
        /// <typeparam name="TService">Service type.</typeparam> <typeparam name="TRequired">Required service type.</typeparam>
        /// <returns>Ignored default of Service type.</returns>
        public static TService Of<TService, TRequired>() { return default(TService); }

        /// <summary>Specifies required service type of parameter or member. Plus specifies if-unresolved policy.</summary>
        /// <typeparam name="TRequired">Required service type if different from parameter/member type.</typeparam>
        /// <param name="ifUnresolved">Defines to throw or to return default if unresolved.</param>
        /// <returns>Returns some (ignored) value.</returns>
        public static TRequired Of<TRequired>(IfUnresolved ifUnresolved) { return default(TRequired); }

        /// <summary>Specifies both service and required service types.</summary>
        /// <typeparam name="TService">Service type.</typeparam> <typeparam name="TRequired">Required service type.</typeparam>
        /// <param name="ifUnresolved">Defines to throw or to return default if unresolved.</param>
        /// <returns>Ignored default of Service type.</returns>
        public static TService Of<TService, TRequired>(IfUnresolved ifUnresolved) { return default(TService); }

        /// <summary>Specifies required service type of parameter or member. Plus specifies service key.</summary>
        /// <typeparam name="TRequired">Required service type if different from parameter/member type.</typeparam>
        /// <param name="serviceKey">Service key object.</param>
        /// <returns>Returns some (ignored) value.</returns>
        public static TRequired Of<TRequired>(object serviceKey) { return default(TRequired); }

        /// <summary>Specifies both service and required service types.</summary>
        /// <typeparam name="TService">Service type.</typeparam> <typeparam name="TRequired">Required service type.</typeparam>
        /// <param name="serviceKey">Service key object.</param>
        /// <returns>Ignored default of Service type.</returns>
        public static TService Of<TService, TRequired>(object serviceKey) { return default(TService); }

        /// <summary>Specifies required service type of parameter or member. Plus specifies if-unresolved policy. Plus specifies service key.</summary>
        /// <typeparam name="TRequired">Required service type if different from parameter/member type.</typeparam>
        /// <param name="ifUnresolved">Defines to throw or to return default if unresolved.</param>
        /// <param name="serviceKey">Service key object.</param>
        /// <returns>Returns some (ignored) value.</returns>
        public static TRequired Of<TRequired>(IfUnresolved ifUnresolved, object serviceKey) { return default(TRequired); }

        /// <summary>Specifies both service and required service types.</summary>
        /// <typeparam name="TService">Service type.</typeparam> <typeparam name="TRequired">Required service type.</typeparam>
        /// <param name="ifUnresolved">Defines to throw or to return default if unresolved.</param>
        /// <param name="serviceKey">Service key object.</param>
        /// <returns>Ignored default of Service type.</returns>
        public static TService Of<TService, TRequired>(IfUnresolved ifUnresolved, object serviceKey) { return default(TService); }

        /// <summary>Specifies argument index starting from 0 to use corresponding custom value factory, 
        /// similar to String.Format <c>"{0}, {1}, etc"</c>.</summary>
        /// <typeparam name="T">Type of dependency. Difference from actual parameter type is ignored.</typeparam>
        /// <param name="argIndex">Argument index starting from 0</param> <returns>Ignored.</returns>
        public static T Index<T>(int argIndex) { return default(T); }

        /// <summary>Name is close to method itself to not forget when renaming the method.</summary>
        public static string ArgIndexMethodName = "Index";
    }
}