using System;

namespace Soloco.ReactiveStarterKit.Membership.Domain
{
    public class PasswordHash
    {
        public Guid Id { get; private set; }
        public Guid UserId { get; private set; }
        public string Hash { get; private set; }

        public PasswordHash()
        {
        }

        public PasswordHash(Guid userId, string hash)
        {
            Id = Guid.NewGuid();
            UserId = userId;

            SetPassword(hash);
        }

        public void SetPassword(string hash)
        {
            Hash = hash;
        }
    }
}