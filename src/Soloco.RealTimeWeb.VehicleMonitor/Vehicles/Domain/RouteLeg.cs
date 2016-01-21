namespace Soloco.RealTimeWeb.VehicleMonitor.Vehicles.Domain
{
    public class RouteLeg
    {
        private readonly Position _startPosition;
        private readonly Position _endPosition;
        private readonly int _steps;
        private double _currentStep;

        public RouteLeg(Position startPosition, Position endPosition, int distanceInMeters)
        {
            _startPosition = startPosition;
            _endPosition = endPosition;
            _steps = (distanceInMeters / 1000) + 1;
        }

        public Position NextPosition()
        {
            var longitude = _startPosition.Longitude + 
                ((_endPosition.Longitude - _startPosition.Longitude) / _steps * _currentStep);

            var latitude = _startPosition.Latitude + 
                ((_endPosition.Latitude - _startPosition.Latitude) / _steps * _currentStep);

            _currentStep++;

            return new Position(latitude, longitude);
        }

        public bool IsFinishd()
        {
            return _currentStep == _steps;
        }
    }
}