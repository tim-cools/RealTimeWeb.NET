using Soloco.RealTimeWeb.Membership.Messages.Commands;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Membership.Services
{
    public interface IProviderTokenValidatorFactory
    {
        IProviderTokenValidator Create(LoginProvider provider);
    }
}