using TravelLife.Domain.Trips.Views;

namespace TravelLife.Domain.Infrastructure.Views
{
    public interface IProject<TView, TEvent>
    {
        void Project(ProjectionContext<Trip, TripCreated> context);
    }
}