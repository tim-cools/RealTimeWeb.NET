namespace Soloco.RealTimeWeb.VehicleMonitor.Vehicles.Domain
{
    public class Position
    {
        public double Longitude { get; }
        public double Latitude { get; }

        public Position(double latitude, double longitude)
        {
            Longitude = longitude;
            Latitude = latitude;
        }
    }

    public class Location
    {
        public string Name { get; set; }
        public Position Position { get; set; }

        public Location(string name, Position position)
        {
            Name = name;
            Position = position;
        }
    }
}