using System;
using Soloco.ReactiveStarterKit.Common.Infrastructure;
using Soloco.ReactiveStarterKit.Membership.Messages.Commands;
using Soloco.ReactiveStarterKit.Membership.Messages.ViewModel;

namespace Soloco.ReactiveStarterKit.Membership.Services
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
            foreach (var validator in _providerTokenValidators)
            {
                if (validator.Provider == provider)
                {
                    return validator;
                }
            }

            throw new BusinessException("Invalid provider: " + provider);
        }
    }
}