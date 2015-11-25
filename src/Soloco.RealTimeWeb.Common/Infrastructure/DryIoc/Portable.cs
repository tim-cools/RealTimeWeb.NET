using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Reflection;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    /// <summary>Ports some methods from .Net 4.0/4.5</summary>
    public static partial class Portable
    {
        /// <summary>Portable version of Type.GetGenericArguments.</summary>
        public static readonly Func<Type, Type[]> GetGenericArguments =
            ExpressionTools.GetMethodDelegateOrNull<Type, Type[]>("GetGenericArguments").ThrowIfNull();
        
        // note: fallback to DefinedTypes (PCL)
        /// <summary>Portable version of Assembly.GetTypes or Assembly.DefinedTypes.</summary>
        public static readonly Func<Assembly, IEnumerable<Type>> GetAssemblyTypes = GetAssemblyTypesMethod();
        //ExpressionTools.GetMethodDelegateOrNull<Assembly, IEnumerable<Type>>("GetTypes").ThrowIfNull();

        private static Func<Assembly, IEnumerable<Type>> GetAssemblyTypesMethod()
        {
            var assemblyParamExpr = Expression.Parameter(typeof(Assembly), "a");

            var definedTypeInfosProperty = typeof(Assembly).GetPropertyOrNull("DefinedTypes");
            var getTypesExpr = definedTypeInfosProperty != null
                ? (Expression)Expression.Property(assemblyParamExpr, definedTypeInfosProperty)
                : Expression.Call(assemblyParamExpr, "GetTypes", ArrayTools.Empty<Type>(), ArrayTools.Empty<Expression>());

            var resultFunc = Expression.Lambda<Func<Assembly, IEnumerable<Type>>>(getTypesExpr, assemblyParamExpr);
            return resultFunc.Compile();
        }

        /// <summary>Portable version of PropertyInfo.GetGetMethod.</summary>
        /// <param name="p">Target property info</param>
        /// <param name="includeNonPublic">(optional) If set then consider non-public getter</param>
        /// <returns>Setter method info if it is defined for property.</returns>
        public static MethodInfo GetGetMethodOrNull(this PropertyInfo p, bool includeNonPublic = false)
        {
            return p.DeclaringType.GetSingleMethodOrNull("get_" + p.Name, includeNonPublic);
        }

        /// <summary>Portable version of PropertyInfo.GetSetMethod.</summary>
        /// <param name="p">Target property info</param>
        /// <param name="includeNonPublic">(optional) If set then consider non-public setter</param>
        /// <returns>Setter method info if it is defined for property.</returns>
        public static MethodInfo GetSetMethodOrNull(this PropertyInfo p, bool includeNonPublic = false)
        {
            return p.DeclaringType.GetSingleMethodOrNull("set_" + p.Name, includeNonPublic);
        }

        /// <summary>Returns managed Thread ID either from Environment or Thread.CurrentThread whichever is available.</summary>
        /// <returns>Managed Thread ID.</returns>
        public static int GetCurrentManagedThreadID()
        {
            var resultID = -1;
            GetCurrentManagedThreadID(ref resultID);
            if (resultID == -1)
                resultID = _getEnvCurrentManagedThreadId();
            return resultID;
        }

        static partial void GetCurrentManagedThreadID(ref int threadID);

        private static readonly MethodInfo _getEnvCurrentManagedThreadIdMethod =
            typeof(Environment).GetMethodOrNull("get_CurrentManagedThreadId", ArrayTools.Empty<Type>());

        private static readonly Func<int> _getEnvCurrentManagedThreadId =
            _getEnvCurrentManagedThreadIdMethod == null ? null :
                Expression.Lambda<Func<int>>(
                    Expression.Call(_getEnvCurrentManagedThreadIdMethod, ArrayTools.Empty<Expression>()),
                    ArrayTools.Empty<ParameterExpression>()).Compile();
    }
}