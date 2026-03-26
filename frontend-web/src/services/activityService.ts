import api from './api';

export interface Activity {
  activityId: string;
  type: 'onboarding' | 'leave_approval' | 'performance_review' | 'promotion' | 'transfer' | 'increment' | 'bonus' | 'exit' | 'training' | 'new_post' | 'new_chat_message' | 'new_ticket' | 'ticket_update' | 'other';
  employeeId: string;
  employeeName: string;
  departmentName?: string;
  message: string;
  description?: string;
  timestamp: string;
  performedBy?: string;
  navigationUrl?: string;
  metadata?: any;
}

export interface ActivityFilters {
  type?: string;
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  departmentId?: string;
}

class ActivityService {
  async getRecentActivities(filters?: ActivityFilters): Promise<Activity[]> {
    try {
      const response = await api.get('/activities/recent', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      // Return mock data for now
      return this.getMockActivities();
    }
  }

  async getActivitiesByUser(userId: string, filters?: ActivityFilters): Promise<Activity[]> {
    try {
      const response = await api.get(`/activities/user/${userId}`, { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching user activities:', error);
      return this.getMockActivities();
    }
  }

  async getActivitiesByDepartment(departmentId: string, filters?: ActivityFilters): Promise<Activity[]> {
    try {
      const response = await api.get(`/activities/department/${departmentId}`, { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching department activities:', error);
      return this.getMockActivities();
    }
  }

  private getMockActivities(): Activity[] {
    return [
      {
        activityId: '1',
        type: 'new_post',
        employeeId: 'hr-admin',
        employeeName: 'HR Team',
        departmentName: 'Human Resources',
        message: 'HR Team posted an announcement about the new Employee Recognition Program',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        navigationUrl: '/hr-connect',
      },
      {
        activityId: '2',
        type: 'onboarding',
        employeeId: 'emp1',
        employeeName: 'John Doe',
        departmentName: 'Engineering',
        message: 'John Doe joined the Engineering team',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        navigationUrl: '/onboarding',
      },
      {
        activityId: '3',
        type: 'new_ticket',
        employeeId: 'emp2',
        employeeName: 'Sarah Johnson',
        departmentName: 'Marketing',
        message: 'Sarah Johnson created a new ticket: Leave Balance Discrepancy',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        navigationUrl: '/hr-connect?tab=helpdesk',
      },
      {
        activityId: '4',
        type: 'leave_approval',
        employeeId: 'emp3',
        employeeName: 'Michael Brown',
        departmentName: 'Sales',
        message: 'Leave request approved for Michael Brown (5 days)',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        navigationUrl: '/leave',
      },
      {
        activityId: '5',
        type: 'new_chat_message',
        employeeId: 'emp4',
        employeeName: 'Emily Davis',
        departmentName: 'Engineering',
        message: 'Emily Davis sent you a message in Engineering Team Chat',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        navigationUrl: '/hr-connect?tab=chat',
      },
      {
        activityId: '6',
        type: 'performance_review',
        employeeId: 'emp5',
        employeeName: 'David Wilson',
        departmentName: 'Product',
        message: 'Performance review completed for David Wilson',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        navigationUrl: '/performance',
      },
      {
        activityId: '7',
        type: 'promotion',
        employeeId: 'emp6',
        employeeName: 'Lisa Anderson',
        departmentName: 'HR',
        message: 'Lisa Anderson promoted to Senior HR Manager',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        navigationUrl: '/employees',
      },
      {
        activityId: '8',
        type: 'ticket_update',
        employeeId: 'hr-helpdesk',
        employeeName: 'HR Helpdesk',
        departmentName: 'Human Resources',
        message: 'Your ticket TKT-2026-002 has been resolved',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        navigationUrl: '/hr-connect?tab=helpdesk',
      },
      {
        activityId: '9',
        type: 'increment',
        employeeId: 'emp7',
        employeeName: 'James Miller',
        departmentName: 'Sales',
        message: 'Salary increment processed for James Miller (12%)',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        navigationUrl: '/employees',
      },
      {
        activityId: '10',
        type: 'training',
        employeeId: 'emp8',
        employeeName: 'Emma Thompson',
        departmentName: 'Marketing',
        message: 'Emma Thompson completed Leadership Training program',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        navigationUrl: '/calendar',
      },
    ];
  }
}

export default new ActivityService();
