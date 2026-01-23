export type ScreenName = 'login' | 'dashboard' | 'fieldVisits' | 'services' | 'serviceRequests' | 'notifications' | 'profile';

export type TaskStatus = 'In Progress' | 'Pending' | 'Urgent' | 'Completed';
export type VisitStatus = 'Scheduled' | 'Completed' | 'Overdue';
export type ServiceStatus = 'Processing' | 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
export type ServicePriority = 'High' | 'Medium' | 'Low';

export type Task = {
  id: string;
  title: string;
  field: string;
  description: string;
  status: TaskStatus;
  harvestDate?: string;
  progress?: number; // 0..100
  color: 'red' | 'amber' | 'green' | 'blue' | 'purple' | 'pink';
  icon: 'droplet' | 'sprout' | 'bug' | 'tractor' | 'filetext' | 'package';
};

export type FieldVisit = {
  id: string;
  fieldName: string;
  supervisor: string;
  date: string;
  time: string;
  crop: string;
  status: VisitStatus;
  findings: string;
  gradient: 'indigo' | 'pink' | 'cyan' | 'orange' | 'green';
  highPriority?: boolean;
};

export type ServiceRequest = {
  id: string;
  requestId: string;
  title: string;
  category: 'Equipment' | 'Consultation' | 'Supplies' | 'Maintenance';
  requestedDate: string;
  priority: ServicePriority;
  status: ServiceStatus;
  description: string;
  assignedTo?: string;
  color: 'rose' | 'violet' | 'teal' | 'orange' | 'blue' | 'fuchsia';
  icon: 'wrench' | 'users' | 'package' | 'settings' | 'truck' | 'tool';
  // Timeline for ALL services
  timeline?: ServiceTimeline;
};

export type UserProfile = {
  name: string;
  role: string;
  email: string;
  phone: string;
  location: string;
  memberSince: string;
  farmName: string;
  totalArea: string;
  primaryCrops: string;
  livestock: string;
  stats: {
    fields: number;
    tasks: number;
    efficiency: string;
  };
};

// Timeline tracking for newly created service requests
export type ServiceCatalogKey =
  | 'tractorRepair'
  | 'agronomistConsultation'
  | 'fertilizerDelivery'
  | 'irrigationSetup'
  | 'pestControl'
  | 'soilAnalysis'
  | 'seedSupply'
  | 'equipmentRental'
  | 'harvestingService'
  | 'droneMonitoring';

export type ServiceTimelineStage = 'submitted' | 'processing' | 'assigned' | 'scheduled' | 'completed';

export type ServiceTimelineEvent = {
  stage: ServiceTimelineStage;
  at: string; // ISO
  title: string;
  description: string;
};

// Shared timeline container used for both catalog-tracked requests and built-in service requests
export type ServiceTimeline = {
  current: ServiceTimelineStage;
  events: ServiceTimelineEvent[];
};

export type ServiceCatalogItem = {
  key: ServiceCatalogKey;
  title: string;
  description: string;
  priceLabel: string;
  priceValue: number;
  daysUntilAvailable: number;
  colorA: string;
  colorB: string;
  icon: 'wrench' | 'users' | 'package' | 'droplet' | 'bug' | 'testtube' | 'sprout' | 'truck' | 'tractor' | 'plane';
};

export type TrackedServiceRequest = {
  id: string;
  requestId: string;
  createdAt: string; // ISO
  service: ServiceCatalogItem;
  timeline: ServiceTimeline;
  scheduledDateLabel: string;
};
