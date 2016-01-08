//Todo remove this when nuget package is stable






/*
 * Licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
 * See https://github.com/aspnet-contrib/AspNet.Security.OAuth.Extensions for more information
 * concerning the license and the contributors participating to this project.
 */

using Microsoft.Extensions.Internal;

namespace AspNet.Security.OAuth.Validation
{
    public static class OAuthValidationDefaults
    {
        /// <summary>
        /// Gets the default scheme used by the validation middleware.
        /// </summary>
        public const string AuthenticationScheme = "Bearer";
    }
}
