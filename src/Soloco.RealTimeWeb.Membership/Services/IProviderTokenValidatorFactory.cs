using Soloco.ReactiveStarterKit.Membership.Messages.Commands;
using Soloco.ReactiveStarterKit.Membership.Messages.ViewModel;

namespace Soloco.ReactiveStarterKit.Membership.Services
{
    public interface IProviderTokenValidatorFactory
    {
        IProviderTokenValidator Create(LoginProvider provider);
    }
}