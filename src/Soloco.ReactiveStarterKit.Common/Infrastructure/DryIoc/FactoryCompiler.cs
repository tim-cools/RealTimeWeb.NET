using System.Linq.Expressions;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    /// <summary>Handles default conversation of expression into <see cref="FactoryDelegate"/>.</summary>
    public static partial class FactoryCompiler
    {
        /// <summary>Wraps service creation expression (body) into <see cref="FactoryDelegate"/> and returns result lambda expression.</summary>
        /// <param name="expression">Service expression (body) to wrap.</param> <returns>Created lambda expression.</returns>
        public static Expression<FactoryDelegate> WrapInFactoryExpression(this Expression expression)
        {
            // Optimize expression by:
            // - removing not required Convert from expression root, because CompiledFactory result still be converted at the end.
            if (expression.NodeType == ExpressionType.Convert)
                expression = ((UnaryExpression)expression).Operand;
            if (expression.Type.IsValueType())
                expression = Expression.Convert(expression, typeof(object));
            return Expression.Lambda<FactoryDelegate>(expression, Container.FactoryDelegateParamsExpr);
        }

        /// <summary>First wraps the input service creation expression into lambda expression and
        /// then compiles lambda expression to actual <see cref="FactoryDelegate"/> used for service resolution.
        /// By default it is using Expression.Compile but if corresponding rule specified (available on .Net 4.0 and higher),
        /// it will compile to DymanicMethod/Assembly.</summary>
        /// <param name="expression">Service expression (body) to wrap.</param>
        /// <param name="rules">Specify requirement to compile expression to DynamicAssembly (available on .Net 4.0 and higher).</param>
        /// <returns>Compiled factory delegate to use for service resolution.</returns>
        public static FactoryDelegate CompileToDelegate(this Expression expression, Rules rules)
        {
            var factoryExpression = expression.WrapInFactoryExpression();
            var factoryDelegate = factoryExpression.Compile();
            //System.Runtime.CompilerServices.RuntimeHelpers.PrepareMethod(factoryDelegate.Method.MethodHandle);
            return factoryDelegate;
        }
    }
}