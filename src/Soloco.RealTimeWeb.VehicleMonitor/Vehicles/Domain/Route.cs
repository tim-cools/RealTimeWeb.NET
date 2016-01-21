using System;
using System.Collections.Generic;

namespace Soloco.RealTimeWeb.VehicleMonitor.Vehicles.Domain
{
    public class Route
    {
        private readonly Position[] _points;
        private int _index = 0;

        public Location Origin { get; }
        public Location Destination { get; }

        public Route(Location origin, Location destination, Position[] points)
        {
            _points = points;
            Origin = origin;
            Destination = destination;
        }

        public Position NextPosition()
        {
            return _index < _points.Length 
                ? _points[_index++] 
                : null;
        }

        public bool IsFinishd()
        {
            return _index == _points.Length;
        }
    }
}