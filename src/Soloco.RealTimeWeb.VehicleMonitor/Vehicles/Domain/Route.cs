using System;
using System.Collections.Generic;
using Soloco.RealTimeWeb.VehicleMonitor.Vehicles.Services;

namespace Soloco.RealTimeWeb.VehicleMonitor.Vehicles.Domain
{
    public class Route
    {
        private readonly RouteLeg[] _legs;
        private int _index = 0;

        public Location Origin { get; }
        public Location Destination { get; }

        public Route(Location origin, Location destination, RouteLeg[] legs)
        {
            _legs = legs;
            Origin = origin;
            Destination = destination;
        }

        public Position NextPosition()
        {

            if (_index == _legs.Length)
            {
                return null;
            }

            var routeLeg = _legs[_index];
            var position = routeLeg.NextPosition();
            if (routeLeg.IsFinishd())
            {
                _index ++;
            }
            return position;
        }

        public bool IsFinishd()
        {
            return _index == _legs.Length;
        }
    }
}