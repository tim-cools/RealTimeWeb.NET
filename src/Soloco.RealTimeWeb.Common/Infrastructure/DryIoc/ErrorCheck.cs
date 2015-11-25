namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    /// <summary>Checked error condition, possible error sources.</summary>
    public enum ErrorCheck
    {
        /// <summary>Unspecified, just throw.</summary>
        Unspecified,
        /// <summary>Predicate evaluated to false.</summary>
        InvalidCondition,
        /// <summary>Checked object is null.</summary>
        IsNull,
        /// <summary>Checked object is of unexpected type.</summary>
        IsNotOfType,
        /// <summary>Checked type is not assignable to expected type</summary>
        TypeIsNotOfType,
        /// <summary>Invoked operation throw, it is source of inner exception.</summary>
        OperationThrows,
    }
}