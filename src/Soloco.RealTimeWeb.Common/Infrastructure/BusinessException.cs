using System;
using System.Collections.Generic;
using System.Runtime.Serialization;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure
{
    public class BusinessException  : Exception
    {
        public IEnumerable<string> Errors { get; }

        public BusinessException()
        {
        }

        public BusinessException(string message) : base(message)
        {
        }

        public BusinessException(string message, IEnumerable<string> Errors) : base(message)
        {
            this.Errors = Errors;
        }

        public BusinessException(string message, Exception innerException) : base(message, innerException)
        {
        }

        protected BusinessException(SerializationInfo info, StreamingContext context) : base(info, context)
        {
        }
    }
}