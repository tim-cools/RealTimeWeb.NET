using System;

namespace Soloco.ReactiveStarterKit.Membership.Messages.ViewModel
{
    public static class LoginProviderExtensions
    {
        public static LoginProvider AsLoginProvider(this string provider)
        {
            switch (provider.ToLowerInvariant())
            {
                case "facebook":
                    return LoginProvider.Facebook;
                case "google":
                    return LoginProvider.Google;
                default:
                    throw new InvalidOperationException("Unknown provider: " +  provider);
            }
        }
    }
}