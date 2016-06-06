using System;
using Microsoft.AspNetCore.Builder;

namespace AspNet.Security.OAuth.Validation
{
    /// <summary>
    /// Provides extension methods used to configure the OAuth2
    /// validation middleware in an ASP.NET 5 pipeline.
    /// </summary>
    public static class OAuthValidationExtensions
    {
        /// <summary>
        /// Adds a new instance of the OAuth2 validation middleware in the ASP.NET 5 pipeline.
        /// </summary>
        /// <param name="app">The application builder.</param>
        /// <returns>The application builder.</returns>
        public static IApplicationBuilder UseOAuthValidation(this IApplicationBuilder app)
        {
            if (app == null)
            {
                throw new ArgumentNullException(nameof(app));
            }

            return app.UseOAuthValidation(options => { });
        }

        /// <summary>
        /// Adds a new instance of the OAuth2 validation middleware in the ASP.NET 5 pipeline.
        /// </summary>
        /// <param name="app">The application builder.</param>
        /// <param name="configuration">The delegate used to configure the validation options.</param>
        /// <returns>The application builder.</returns>
        public static IApplicationBuilder UseOAuthValidation(
            this IApplicationBuilder app,
            Action<OAuthValidationOptions> configuration)
        {
            if (app == null)
            {
                throw new ArgumentNullException(nameof(app));
            }

            if (configuration == null)
            {
                throw new ArgumentNullException(nameof(configuration));
            }

            var options = new OAuthValidationOptions();
            configuration(options);

            return app.UseOAuthValidation(options);
        }

        /// <summary>
        /// Adds a new instance of the OAuth2 validation middleware in the ASP.NET 5 pipeline.
        /// </summary>
        /// <param name="app">The application builder.</param>
        /// <param name="options">The options used to configure the validation middleware.</param>
        /// <returns>The application builder.</returns>
        public static IApplicationBuilder UseOAuthValidation(
            this IApplicationBuilder app,
            OAuthValidationOptions options)
        {
            if (app == null)
            {
                throw new ArgumentNullException(nameof(app));
            }

            if (options == null)
            {
                throw new ArgumentNullException(nameof(options));
            }

            return app.UseMiddleware<OAuthValidationMiddleware>(options);
        }
    }
}