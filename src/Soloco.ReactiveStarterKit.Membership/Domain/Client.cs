using System;
using System.ComponentModel.DataAnnotations;

namespace Soloco.ReactiveStarterKit.Membership.Models
{
    public class Client
    {
        [Key] 
        public Guid Id { get; set; }
        [Required]
        public string Secret { get; set; }
        [Required]
        [MaxLength(100)]
        public string Name { get; set; }
        public ApplicationTypes ApplicationType { get; set; }
        public bool Active { get; set; }
        public int RefreshTokenLifeTime { get; set; }
        [MaxLength(100)]
        public string AllowedOrigin { get; set; }

        public string Key { get; set; }
    }
}