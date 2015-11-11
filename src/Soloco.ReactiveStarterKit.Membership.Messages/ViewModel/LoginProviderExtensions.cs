using System;

namespace Soloco.ReactiveStarterKit.Membership.Messages.ViewModel
{
    public static class LoginProviderExtensions
    {
        public static LoginProvider AsLoginProvider(this string provider)
        {
            return (LoginProvider) Enum.Parse(typeof (LoginProvider), provider);
        }
    }
}