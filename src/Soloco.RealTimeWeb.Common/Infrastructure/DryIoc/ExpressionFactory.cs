using System;
using System.Linq.Expressions;

namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    /// <summary>Creates service expression using client provided expression factory delegate.</summary>
    public sealed class ExpressionFactory : Factory
    {
        /// <summary>Wraps provided delegate into factory.</summary>
        /// <param name="getServiceExpression">Delegate that will be used internally to create service expression.</param>
        /// <param name="reuse">(optional) Reuse.</param> <param name="setup">(optional) Setup.</param>
        public ExpressionFactory(Func<Request, Expression> getServiceExpression, IReuse reuse = null, Setup setup = null)
            : base(reuse, setup)
        {
            _getServiceExpression = getServiceExpression.ThrowIfNull();
        }

        /// <summary>Creates service expression using wrapped delegate.</summary>
        /// <param name="request">Request to resolve.</param> <returns>Expression returned by stored delegate.</returns>
        public override Expression CreateExpressionOrDefault(Request request)
        {
            return _getServiceExpression(request);
        }

        private readonly Func<Request, Expression> _getServiceExpression;
    }
}