using System;
using System.Linq.Expressions;
using System.Reflection;

namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    /// <summary>Tools for expressions, that are not supported out-of-box.</summary>
    public static class ExpressionTools
    {
        /// <summary>Extracts method info from method call expression.
        /// It is allow to use type-safe method declaration instead of string method name.</summary>
        /// <param name="methodCall">Lambda wrapping method call.</param>
        /// <returns>Found method info or null if lambda body is not method call.</returns>
        public static MethodInfo GetCalledMethodOrNull(LambdaExpression methodCall)
        {
            var callExpr = methodCall.Body as MethodCallExpression;
            return callExpr == null ? null : callExpr.Method;
        }


        /// <summary>Extracts member info from property or field getter. Enables type-safe property declarations without using strings.</summary>
        /// <typeparam name="T">Type of member holder.</typeparam>
        /// <param name="getter">Expected to contain member access: t => t.MyProperty.</param>
        /// <returns>Extracted member info or null if getter does not contain member access.</returns>
        public static MemberInfo GetAccessedMemberOrNull<T>(Expression<Func<T, object>> getter)
        {
            var body = getter.Body;
            var member = body as MemberExpression ?? ((UnaryExpression)body).Operand as MemberExpression;
            return member == null ? null : member.Member;
        }

        /// <summary>Creates and returns delegate calling method without parameters.</summary>
        /// <typeparam name="TOwner">Method owner type.</typeparam>
        /// <typeparam name="TReturn">Method return type.</typeparam>
        /// <param name="methodName">Method name to find.</param>
        /// <returns>Created delegate or null, if no method with such name is found.</returns>
        public static Func<TOwner, TReturn> GetMethodDelegateOrNull<TOwner, TReturn>(string methodName)
        {
            var methodInfo = typeof(TOwner).GetMethodOrNull(methodName, ArrayTools.Empty<Type>());
            if (methodInfo == null) return null;
            var thisExpr = Expression.Parameter(typeof(TOwner), "_");
            var methodCallExpr = Expression.Call(thisExpr, methodInfo, ArrayTools.Empty<Expression>());
            var methodExpr = Expression.Lambda<Func<TOwner, TReturn>>(methodCallExpr, thisExpr);
            return methodExpr.Compile();
        }

        /// <summary>Creates default(T) expression for provided <paramref name="type"/>.</summary>
        /// <param name="type">Type to get default value of.</param>
        /// <returns>Default value expression.</returns>
        public static Expression GetDefaultValueExpression(this Type type)
        {
            return Expression.Call(_getDefaultMethod.MakeGenericMethod(type), ArrayTools.Empty<Expression>());
        }

        private static readonly MethodInfo _getDefaultMethod = typeof(ExpressionTools)
            .GetMethodOrNull("GetDefault", ArrayTools.Empty<Type>());
        internal static T GetDefault<T>() { return default(T); }
    }
}