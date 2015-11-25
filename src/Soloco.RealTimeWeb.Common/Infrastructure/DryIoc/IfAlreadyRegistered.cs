namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    /// <summary>Specifies options to handle situation when registering some service already present in the registry.</summary>
    public enum IfAlreadyRegistered
    {
        /// <summary>Appends new default registration or throws registration with the same key.</summary>
        AppendNotKeyed,
        /// <summary>Throws if default or registration with the same key is already exist.</summary>
        Throw,
        /// <summary>Keeps old default or keyed registration ignoring new registration: ensures Register-Once semantics.</summary>
        Keep,
        /// <summary>Replaces old registration with new one.</summary>
        Replace
    }
}