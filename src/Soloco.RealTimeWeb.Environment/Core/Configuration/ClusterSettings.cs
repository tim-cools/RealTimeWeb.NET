using System;
using System.Collections.Generic;
using System.Linq;
using Amazon;

namespace Soloco.RealTimeWeb.Environment.Core.Configuration
{
    public class ClusterSettings
    {
        public string Name { get; set; }
        public TaskSettings[] Tasks { get; set; }
        public String[] AvailabilityZones { get; set; }
        public String VpcCidr { get; set; }

        public TaskSettings GetTask(string name)
        {
            if (Tasks == null)
            {
                throw new InvalidOperationException("Tasks is null");
            }

            var task = Tasks.FirstOrDefault(criteria => criteria.Name == name);
            if (task == null)
            {
                throw new InvalidOperationException("Could not find task: " + name);
            }
            return task;
        }
    }
}