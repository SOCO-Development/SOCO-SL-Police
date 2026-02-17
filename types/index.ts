export interface Complaint {
  id: string;
  reference: string;
  created: string;
  status: string;
  complainantName: string;
  complaintType: string;
  category: string;
  receivedVia: string;
  receivedDate: string;
  incidentDate: string;
  placeOfOffence: string;
  policeStation: string;
  forwardFrom?: string;
}

export interface Task {
  id: string;
  assignee: string;
  assigneeId: string;
  assigneeRole: string;
  assigneeStation: string;
  taskNumber: string;
  date: string;
  taskDone: string;
  detail: string;
  timestamp: string;
  assignedAt: string;
  workDays: number;
}

export interface HistoryEntry {
  location: string;
  assignedAt: string;
  workDays: number;
  tasks: Task[];
}

export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  path?: string;
  children?: MenuItem[];
}

export interface PoliceLocation {
  id: string;
  locationCategory: string;
  locationName: string;
  notificationContact?: string;
}

