namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    /// <summary>Used to represent multiple default service keys. 
    /// Exposes <see cref="RegistrationOrder"/> to determine order of service added.</summary>
    public sealed class DefaultKey
    {
        /// <summary>Default value.</summary>
        public static readonly DefaultKey Value = new DefaultKey(0);

        /// <summary>Allows to determine service registration order.</summary>
        public readonly int RegistrationOrder;

        /// <summary>Create new default key with specified registration order.</summary>
        /// <param name="registrationOrder"></param> <returns>New default key.</returns>
        public static DefaultKey Of(int registrationOrder)
        {
            if (registrationOrder < _keyPool.Length)
                return _keyPool[registrationOrder];

            var nextKey = new DefaultKey(registrationOrder);
            if (registrationOrder == _keyPool.Length)
                _keyPool = _keyPool.AppendOrUpdate(nextKey);
            return nextKey;
        }

        /// <summary>Returns next default key with increased <see cref="RegistrationOrder"/>.</summary>
        /// <returns>New key.</returns>
        public DefaultKey Next()
        {
            return Of(RegistrationOrder + 1);
        }

        /// <summary>Compares keys based on registration order.</summary>
        /// <param name="key">Key to compare with.</param>
        /// <returns>True if keys have the same order.</returns>
        public override bool Equals(object key)
        {
            var defaultKey = key as DefaultKey;
            return key == null || defaultKey != null && defaultKey.RegistrationOrder == RegistrationOrder;
        }

        /// <summary>Returns registration order as hash.</summary> <returns>Hash code.</returns>
        public override int GetHashCode()
        {
            return RegistrationOrder;
        }

        /// <summary>Prints registration order to string.</summary> <returns>Printed string.</returns>
        public override string ToString()
        {
            return "DefaultKey.Of(" + RegistrationOrder + ")";
        }

        #region Implementation

        private static DefaultKey[] _keyPool = { Value };

        private DefaultKey(int registrationOrder)
        {
            RegistrationOrder = registrationOrder;
        }

        #endregion
    }
}