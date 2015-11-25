using System;
using System.Diagnostics.CodeAnalysis;
using System.Text;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    /// <summary>Exception that container throws in case of error. Dedicated exception type simplifies
    /// filtering or catching container relevant exceptions from client code.</summary>
    [SuppressMessage("Microsoft.Usage", "CA2237:MarkISerializableTypesWithSerializable", Justification = "Not available in PCL.")]
    public class ContainerException : InvalidOperationException
    {
        /// <summary>Error code of exception, possible values are listed in <see cref="Error"/> class.</summary>
        public readonly int Error;

        /// <summary>Creates exception by wrapping <paramref name="errorCode"/> and its message,
        /// optionally with <paramref name="inner"/> exception.</summary>
        /// <param name="errorCheck">Type of check</param>
        /// <param name="errorCode">Error code, check <see cref="Error"/> for possible values.</param>
        /// <param name="arg0">(optional) Arguments for formatted message.</param> <param name="arg1"></param> <param name="arg2"></param> <param name="arg3"></param>
        /// <param name="inner">(optional) Inner exception.</param>
        /// <returns>Created exception.</returns>
        public static ContainerException Of(ErrorCheck errorCheck, int errorCode,
            object arg0, object arg1 = null, object arg2 = null, object arg3 = null,
            Exception inner = null)
        {
            string message = null;
            if (errorCode != -1)
                message = string.Format(DryIoc.Error.Messages[errorCode], Print(arg0), Print(arg1), Print(arg2), Print(arg3));
            else
            {
                switch (errorCheck) // handle error check when error code is unspecified.
                {
                    case ErrorCheck.InvalidCondition:
                        errorCode = DryIoc.Error.InvalidCondition;
                        message = string.Format(DryIoc.Error.Messages[errorCode], Print(arg0), Print(arg0.GetType()));
                        break;
                    case ErrorCheck.IsNull:
                        errorCode = DryIoc.Error.IsNull;
                        message = string.Format(DryIoc.Error.Messages[errorCode], Print(arg0));
                        break;
                    case ErrorCheck.IsNotOfType:
                        errorCode = DryIoc.Error.IsNotOfType;
                        message = string.Format(DryIoc.Error.Messages[errorCode], Print(arg0), Print(arg1));
                        break;
                    case ErrorCheck.TypeIsNotOfType:
                        errorCode = DryIoc.Error.TypeIsNotOfType;
                        message = string.Format(DryIoc.Error.Messages[errorCode], Print(arg0), Print(arg1));
                        break;
                }
            }

            return inner == null
                ? new ContainerException(errorCode, message)
                : new ContainerException(errorCode, message, inner);
        }

        /// <summary>Creates exception with message describing cause and context of error.</summary>
        /// <param name="error"></param>
        /// <param name="message">Error message.</param>
        protected ContainerException(int error, string message)
            : base(message)
        {
            Error = error;
        }

        /// <summary>Creates exception with message describing cause and context of error,
        /// and leading/system exception causing it.</summary>
        /// <param name="error"></param>
        /// <param name="message">Error message.</param>
        /// <param name="innerException">Underlying system/leading exception.</param>
        protected ContainerException(int error, string message, Exception innerException)
            : base(message, innerException)
        {
            Error = error;
        }

        /// <summary>Prints argument for formatted message.</summary> <param name="arg">To print.</param> <returns>Printed string.</returns>
        protected static string Print(object arg)
        {
            return new StringBuilder().Print(arg).ToString();
        }
    }
}