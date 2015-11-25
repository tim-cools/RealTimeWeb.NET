using System;
using System.Linq;
using Soloco.RealTimeWeb.Common.Infrastructure;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Membership.Services
{
    public class ProviderTokenValidatorFactory : IProviderTokenValidatorFactory
    {
        private readonly IProviderTokenValidator[] _providerTokenValidators;

        public ProviderTokenValidatorFactory(IProviderTokenValidator[] providerTokenValidators)
        {
            if (providerTokenValidators == null) throw new ArgumentNullException(nameof(providerTokenValidators));

            _providerTokenValidators = providerTokenValidators;
        }

        public IProviderTokenValidator Create(LoginProvider provider)
        {
            var validator = _providerTokenValidators.SingleOrDefault(criteria => criteria.Provider == provider);
            if (validator == null)
            {
                throw new BusinessException("Invalid provider: " + provider);
            }
            return validator;
        }
    }
}