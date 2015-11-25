namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    /// <summary>Called from generated code.</summary>
    public static class ThrowInGeneratedCode
    {
        /// <summary>Throws if object is null.</summary>
        /// <param name="obj">object to check.</param><param name="message">Error message.</param>
        /// <returns>object if not null.</returns>
        public static object ThrowNewErrorIfNull(this object obj, string message)
        {
            if (obj == null) Throw.It(Error.Of(message));
            return obj;
        }
    }
}