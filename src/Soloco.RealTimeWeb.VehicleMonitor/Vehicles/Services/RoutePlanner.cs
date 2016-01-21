using System;
using System.Linq;
using System.Threading.Tasks;
using GoogleMapsApi;
using GoogleMapsApi.Entities.Directions.Request;
using GoogleMapsApi.Entities.Directions.Response;
using Soloco.RealTimeWeb.VehicleMonitor.Vehicles.Domain;
using Route = Soloco.RealTimeWeb.VehicleMonitor.Vehicles.Domain.Route;

namespace Soloco.RealTimeWeb.VehicleMonitor.Vehicles.Services
{
    public class RoutePlanner : IRoutePlanner
    {
        private readonly Location[] _locations = {
            new Location("Antwerp", new Position(51.219448, 4.402464)),
            new Location("Paris", new Position(48.856614, 2.352222)),
            new Location("Berlin", new Position(52.520007, 13.404954)),
            new Location("Amsterdam", new Position(52.370216, 4.895168)),
            new Location("Prague", new Position(52.370216, 4.895168)),
            new Location("Zurich", new Position(47.376887, 8.541694)),
            new Location("Luxenbourg", new Position(49.815273,6.129583)),
        };
        private readonly Random _random = new Random();

        public Location RandomLocation()
        {
            var index = _random.Next(_locations.Length - 1);
            return _locations[index];
        }

        public async Task<Route> PlanNewRoute(Location origin)
        {
            var destination = NextLocation(origin);
            var request = new DirectionsRequest
            {
                Origin = origin.Name,
                Destination = destination.Name
            };

            return await CallGoogleService(origin, request, destination);
        }

        private static async Task<Route> CallGoogleService(Location origin, DirectionsRequest request, Location destination)
        {
            var count = 0;
            while (count < 3)
            {
                try
                {
                    var result = await GoogleMaps.Directions.QueryAsync(request);
                    if (result.Status == DirectionsStatusCodes.OK)
                    {
                        return MapRoute(origin, destination, result);
                    }
                }
                catch (Exception exception)
                {
                    Console.WriteLine("Error while contacting the google service: " + exception.ToString());
                }
                count ++;
            }
            throw new InvalidOperationException("Could not contact the Google service after 3 times.");
        }

        private static Route MapRoute(Location origin, Location destination, DirectionsResponse result)
        {
            var points = result.Routes.First()
                .Legs.SelectMany(leg => leg.Steps)
                .Select(step => new Position(step.EndLocation.Latitude, step.EndLocation.Longitude))
                .ToArray();

            return new Route(origin, destination, points);
        }

        private Location NextLocation(Location origin)
        {
            var next = RandomLocation();
            while (next.Name == origin.Name)
            {
                next = RandomLocation();
            }
            return next;
        }
    }
}