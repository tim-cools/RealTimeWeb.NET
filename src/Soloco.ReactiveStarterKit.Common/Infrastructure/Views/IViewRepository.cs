using System;

namespace TravelLife.Domain.Infrastructure.Views
{
    internal interface IViewRepository
    {
        T Get<T>(Guid destinationId);
    }
}