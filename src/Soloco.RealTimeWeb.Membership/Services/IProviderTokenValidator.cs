using System.Threading.Tasks;
using Soloco.RealTimeWeb.Membership.Domain;
using Soloco.RealTimeWeb.Membership.Messages.Commands;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Membership.Services
{
    public interface IProviderTokenValidator
    {
        LoginProvider Provider { get; }

        Task<ParsedExternalAccessToken> ValidateToken(string accessToken);
    }
}