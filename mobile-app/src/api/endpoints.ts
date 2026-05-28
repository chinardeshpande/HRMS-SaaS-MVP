import api from './client';
import {
  LoginRequest,
  AuthResponse,
  EmployeeProfile,
  Employee,
  AttendanceRecord,
  AttendancePunchRequest,
  LeaveBalance,
  LeaveApplicationRequest,
  LeaveApplication,
  Resignation,
  ExitClearance,
  Goal,
  PerformanceReview,
  HRPost,
  Group,
  Comment
} from '../types';

/**
 * AuroraHR API Endpoint bindings
 */
// ============================================================================
// Mock Data Store for HR Connect (Collaboration Hub)
// ============================================================================
let _mockGroups: Group[] = [
  {
    groupId: 'g-announcements',
    name: 'Announcements',
    description: 'Official company-wide announcements, policy updates, and news.',
    groupType: 'topic',
    privacy: 'public',
    memberCount: 24,
    members: [],
    createdBy: 'system-admin',
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  },
  {
    groupId: 'g-engineering',
    name: 'Engineering Discussion',
    description: 'Technical brainstorming, architecture review, and coding talk.',
    groupType: 'department',
    privacy: 'public',
    memberCount: 12,
    members: [],
    createdBy: 'm-aurelius',
    createdAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
  },
  {
    groupId: 'g-wellness',
    name: 'Wellness & Social',
    description: 'Life outside work, fitness challenges, general banter, and fun.',
    groupType: 'social',
    privacy: 'public',
    memberCount: 18,
    members: [],
    createdBy: 's-johnson',
    createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
  }
];

let _mockPosts: HRPost[] = [
  {
    postId: 'p-1',
    authorId: 'e-sarah-johnson',
    authorName: 'Sarah Johnson',
    authorAvatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=0A66C2&color=fff',
    authorDepartment: 'Human Resources',
    authorDesignation: 'HR Lead',
    title: 'AuroraHR Annual Offsite 2026 Announced!',
    content: 'We are thrilled to announce our Annual Company Offsite is happening in Goa this coming November! 🏖️ Pack your bags for three days of team-building, strategy workshops, and relaxation by the beach. Stay tuned for registration forms and flight bookings next week!',
    postType: 'announcement',
    visibility: 'public',
    groupId: 'g-announcements',
    isPinned: true,
    reactions: [
      { reactionId: 'r-1', userId: 'e-1', userName: 'Alex Mercer', reactionType: 'celebrate', createdAt: new Date().toISOString() },
      { reactionId: 'r-2', userId: 'e-2', userName: 'John Doe', reactionType: 'love', createdAt: new Date().toISOString() }
    ],
    comments: [
      { commentId: 'c-1', postId: 'p-1', authorId: 'e-1', authorName: 'Alex Mercer', content: "Can't wait! Goa offsites are legendary. 🚀", createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
      { commentId: 'c-2', postId: 'p-1', authorId: 'e-2', authorName: 'John Doe', content: 'Awesome! Will families be allowed?', createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString() }
    ],
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },
  {
    postId: 'p-2',
    authorId: 'e-marcus-aurelius',
    authorName: 'Marcus Aurelius',
    authorAvatar: 'https://ui-avatars.com/api/?name=Marcus+Aurelius&background=22c55e&color=fff',
    authorDepartment: 'Engineering',
    authorDesignation: 'Lead Architect',
    title: 'TypeScript 5.x Upgrade and Standard Lints',
    content: "We have upgraded all our SaaS core services to TypeScript 5.4. Please run `npm install` to update your node_modules. If you encounter any type error or lint warning during CI/CD builds, refer to the wiki page on standard rules. Let's keep the build green!",
    postType: 'discussion',
    visibility: 'public',
    groupId: 'g-engineering',
    isPinned: false,
    reactions: [
      { reactionId: 'r-3', userId: 'e-1', userName: 'Alex Mercer', reactionType: 'like', createdAt: new Date().toISOString() }
    ],
    comments: [],
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    postId: 'p-3',
    authorId: 'e-jane-doe',
    authorName: 'Jane Doe',
    authorAvatar: 'https://ui-avatars.com/api/?name=Jane+Doe&background=f59e0b&color=fff',
    authorDepartment: 'Operations',
    authorDesignation: 'Ops Manager',
    title: 'Fitness Steps Challenge starting Monday!',
    content: 'Get ready to lace up your running shoes! 🏃‍♂️ We are starting a 10,000 steps-a-day challenge this Monday. The highest stepper at the end of the month wins a brand new smartwatch! Join the Wellness group and track your daily count under the Steps tracker channel.',
    postType: 'event',
    visibility: 'public',
    groupId: 'g-wellness',
    isPinned: false,
    reactions: [
      { reactionId: 'r-4', userId: 'e-sarah-johnson', userName: 'Sarah Johnson', reactionType: 'insightful', createdAt: new Date().toISOString() },
      { reactionId: 'r-5', userId: 'e-1', userName: 'Alex Mercer', reactionType: 'celebrate', createdAt: new Date().toISOString() }
    ],
    comments: [
      { commentId: 'c-3', postId: 'p-3', authorId: 'e-marcus-aurelius', authorName: 'Marcus Aurelius', content: 'Walk and think is a stoic classic.', createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() }
    ],
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  }
];

export const endpoints = {
  auth: {
    login: (data: LoginRequest) => 
      api.post<AuthResponse>('/auth/login', data),
    
    logout: () => 
      api.post('/auth/logout'),
  },

  employees: {
    list: (params?: { departmentId?: string; search?: string; status?: string; page?: number; limit?: number }) => 
      api.get<Employee[]>('/employees', { params }),
    
    detail: (id: string) => 
      api.get<EmployeeProfile>(`/employees/${id}`),
    
    update: (id: string, data: Partial<Employee>) =>
      api.put<Employee>(`/employees/${id}`, data),
  },

  attendance: {
    punch: async (data: AttendancePunchRequest) => {
      const isPunchIn = data.action === 'in';
      const url = isPunchIn ? '/attendance/clock-in' : '/attendance/clock-out';
      const payload = isPunchIn ? { location: data.remarks || 'Office' } : {};
      
      const res = await api.post<any>(url, payload);
      if (res.success && res.data) {
        const b = res.data;
        const mapped: AttendanceRecord = {
          attendanceId: b.attendanceId,
          tenantId: b.tenantId,
          employeeId: b.employeeId,
          date: b.date,
          punchIn: b.checkIn,
          punchOut: b.checkOut,
          remarks: b.notes,
          workHours: Number(b.workMinutes) / 60,
          status: b.status,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt
        };
        return {
          success: true,
          data: mapped
        };
      }
      return res;
    },
    
    today: async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const res = await api.get<any[]>('/attendance/my-attendance', {
          params: { startDate: todayStr, endDate: todayStr }
        });
        
        if (res.success && res.data && res.data.length > 0) {
          // Find today's record specifically to handle any timezone shifts
          const todayRecord = res.data.find((r: any) => {
            const rDateStr = r.date ? new Date(r.date).toISOString().split('T')[0] : '';
            return rDateStr === todayStr || r.date === todayStr;
          }) || res.data[0];

          const hasPunchedIn = !!(todayRecord.checkIn && !todayRecord.checkOut);
          
          let totalHoursToday = 0;
          if (hasPunchedIn && todayRecord.checkIn) {
            totalHoursToday = (new Date().getTime() - new Date(todayRecord.checkIn).getTime()) / 3600000;
          } else if (todayRecord.workMinutes) {
            totalHoursToday = Number(todayRecord.workMinutes) / 60;
          }

          const activePunch: AttendanceRecord = {
            attendanceId: todayRecord.attendanceId,
            tenantId: todayRecord.tenantId,
            employeeId: todayRecord.employeeId,
            date: todayRecord.date,
            punchIn: todayRecord.checkIn,
            punchOut: todayRecord.checkOut,
            remarks: todayRecord.notes,
            workHours: Number(todayRecord.workMinutes) / 60,
            status: todayRecord.status,
            createdAt: todayRecord.createdAt,
            updatedAt: todayRecord.updatedAt
          };

          return {
            success: true,
            data: {
              hasPunchedIn,
              todayPunchIn: todayRecord.checkIn,
              todayPunchOut: todayRecord.checkOut,
              totalHoursToday,
              activePunch
            }
          };
        }
        
        return {
          success: true,
          data: {
            hasPunchedIn: false,
            totalHoursToday: 0
          }
        };
      } catch (err) {
        console.warn('⚠️ Today attendance fetch failed:', err);
        return {
          success: true,
          data: {
            hasPunchedIn: false,
            totalHoursToday: 0
          }
        };
      }
    },
    
    logs: async (params?: { employeeId?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) => {
      const res = await api.get<any[]>('/attendance/my-attendance', { params });
      if (res.success && res.data) {
        const mapped = res.data.map((b: any) => ({
          attendanceId: b.attendanceId,
          tenantId: b.tenantId,
          employeeId: b.employeeId,
          date: b.date,
          punchIn: b.checkIn,
          punchOut: b.checkOut,
          remarks: b.notes,
          workHours: Number(b.workMinutes) / 60,
          status: b.status,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt
        }));
        return {
          success: true,
          data: mapped
        };
      }
      return res;
    },
  },

  leaves: {
    balance: async () => {
      try {
        const res = await api.get<any[]>('/leave/my-balance');
        const mappedBalances: LeaveBalance = { CL: 12, SL: 10, PL: 15 };
        
        if (res.success && res.data) {
          res.data.forEach((b: any) => {
            const totalAllocated = Number(b.totalAllocated) || 0;
            const carriedForward = Number(b.carriedForward) || 0;
            const used = Number(b.used) || 0;
            const pending = Number(b.pending) || 0;
            const available = totalAllocated + carriedForward - used - pending;
            
            if (b.leaveType === 'casual') mappedBalances.CL = available;
            else if (b.leaveType === 'sick') mappedBalances.SL = available;
            else if (b.leaveType === 'earned') mappedBalances.PL = available;
          });
        }
        return {
          success: true,
          data: mappedBalances
        };
      } catch (err) {
        console.warn('⚠️ Leave balance fetch failed, using fallback defaults:', err);
        return {
          success: true,
          data: { CL: 12, SL: 10, PL: 15 }
        };
      }
    },
    
    apply: async (data: LeaveApplicationRequest) => {
      const typeMap: Record<string, string> = {
        'casual-leave-uuid': 'casual',
        'sick-leave-uuid': 'sick',
        'earned-leave-uuid': 'earned'
      };
      const leaveType = typeMap[data.leaveTypeId] || 'casual';
      return api.post<LeaveApplication>('/leave/apply', {
        leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason || ''
      });
    },
    
    applications: async (params?: { status?: string; employeeId?: string; managerId?: string }) => {
      let url = '/leave/my-requests';
      if (params?.managerId) {
        url = '/leave/pending-approvals';
      }
      
      const res = await api.get<any[]>(url, { params });
      if (res.success && res.data) {
        const mapped = res.data.map((b: any) => ({
          leaveId: b.leaveId,
          tenantId: b.tenantId,
          employeeId: b.employeeId,
          leaveTypeId: b.leaveType === 'casual' ? 'casual-leave-uuid' : b.leaveType === 'sick' ? 'sick-leave-uuid' : 'earned-leave-uuid',
          startDate: b.startDate,
          endDate: b.endDate,
          days: Number(b.numberOfDays) || 1,
          isHalfDay: false,
          reason: b.reason,
          status: b.status,
          appliedAt: b.createdAt,
          managerComments: b.approverComments,
          employee: b.employee
        }));
        return {
          success: true,
          data: mapped
        };
      }
      return res;
    },
    
    approve: (id: string) => 
      api.put<LeaveApplication>(`/leave/${id}/approve`, { status: 'approved' }),
    
    reject: (id: string, comments: string) => 
      api.put<LeaveApplication>(`/leave/${id}/approve`, { status: 'rejected', comments }),
  },

  exit: {
    resign: (data: { noticeDate: string; lastWorkingDay: string; reason: string }) => 
      api.post<Resignation>('/exit/resign', data),
    
    pending: () => 
      api.get<Resignation[]>('/exit/pending'),
    
    accept: (employeeId: string) => 
      api.post(`/exit/${employeeId}/accept`),
    
    clearance: async (resignId: string) => {
      try {
        const url = resignId === 'demo-resignation-uuid' ? '/exit/clearances/pending' : `/exit/cases/${resignId}/clearances`;
        const res = await api.get<ExitClearance[]>(url);
        return res;
      } catch (err) {
        console.warn('⚠️ Exit clearance fetch failed, returning mock data:', err);
        return {
          success: true,
          data: [
            { clearanceId: '1', tenantId: 'demo-tenant', resignId: resignId, departmentCategory: 'IT Assets', status: 'cleared' as const, remarks: 'MacBook & Keycard returned', createdAt: '', updatedAt: '' },
            { clearanceId: '2', tenantId: 'demo-tenant', resignId: resignId, departmentCategory: 'Finance & Accounts', status: 'pending' as const, remarks: 'Pending final settlement calculation', createdAt: '', updatedAt: '' },
            { clearanceId: '3', tenantId: 'demo-tenant', resignId: resignId, departmentCategory: 'HR & Administration', status: 'cleared' as const, remarks: 'Exit interview form submitted', createdAt: '', updatedAt: '' },
          ]
        };
      }
    },
    
    clearItem: (resignId: string, clearanceId: string, remarks?: string) => 
      api.post(`/exit/${resignId}/clearance/${clearanceId}`, { remarks }),
  },

  vault: {
    getLibrary: async (params?: { resourceType?: string; category?: string; searchTerm?: string }) => {
      try {
        const res = await api.get<any[]>('/digital-library', { params });
        return res;
      } catch (err) {
        console.warn('⚠️ Fetching digital library items failed, returning mock data:', err);
        return {
          success: true,
          data: [
            { libraryId: 'lib-1', tenantId: 'demo-tenant', employeeId: 'e-1', fileName: 'payslip_may_2026.pdf', fileUrl: 'https://aurorahr.in/uploads/payslip_may_2026.pdf', fileType: 'application/pdf', fileSize: 102450, resourceType: 'document' as const, accessLevel: 'private' as const, category: 'payslip', createdAt: new Date(2026, 4, 30).toISOString(), updatedAt: new Date(2026, 4, 30).toISOString() },
            { libraryId: 'lib-2', tenantId: 'demo-tenant', employeeId: 'e-1', fileName: 'payslip_april_2026.pdf', fileUrl: 'https://aurorahr.in/uploads/payslip_april_2026.pdf', fileType: 'application/pdf', fileSize: 102120, resourceType: 'document' as const, accessLevel: 'private' as const, category: 'payslip', createdAt: new Date(2026, 3, 30).toISOString(), updatedAt: new Date(2026, 3, 30).toISOString() },
            { libraryId: 'lib-3', tenantId: 'demo-tenant', employeeId: 'e-1', fileName: 'payslip_march_2026.pdf', fileUrl: 'https://aurorahr.in/uploads/payslip_march_2026.pdf', fileType: 'application/pdf', fileSize: 101890, resourceType: 'document' as const, accessLevel: 'private' as const, category: 'payslip', createdAt: new Date(2026, 2, 31).toISOString(), updatedAt: new Date(2026, 2, 31).toISOString() },
            { libraryId: 'lib-4', tenantId: 'demo-tenant', employeeId: 'e-1', fileName: 'AuroraHR_Employee_Handbook_2026.pdf', fileUrl: 'https://aurorahr.in/uploads/handbook.pdf', fileType: 'application/pdf', fileSize: 2450000, resourceType: 'document' as const, accessLevel: 'public' as const, category: 'policy', createdAt: new Date(2026, 0, 1).toISOString(), updatedAt: new Date(2026, 0, 1).toISOString() },
            { libraryId: 'lib-5', tenantId: 'demo-tenant', employeeId: 'e-1', fileName: 'AURORAHR_Travel_Policy_v4.pdf', fileUrl: 'https://aurorahr.in/uploads/travel_policy.pdf', fileType: 'application/pdf', fileSize: 580000, resourceType: 'document' as const, accessLevel: 'public' as const, category: 'policy', createdAt: new Date(2026, 1, 15).toISOString(), updatedAt: new Date(2026, 1, 15).toISOString() }
          ]
        };
      }
    },
    
    getIssuedDocuments: async (employeeId: string) => {
      try {
        const res = await api.get<any>(`/documents/entity/employee/${employeeId}`);
        return res;
      } catch (err) {
        console.warn('⚠️ Fetching employee documents failed, returning mock data:', err);
        return {
          success: true,
          data: {
            documents: [
              { documentId: 'doc-1', tenantId: 'demo-tenant', employeeId, documentType: 'appointment_letter', documentName: 'AuroraHR_Appointment_Letter.pdf', fileSizeBytes: 142500, createdAt: new Date(2025, 11, 15).toISOString(), status: 'issued' as const, format: 'pdf' as const, updatedAt: new Date(2025, 11, 15).toISOString() },
              { documentId: 'doc-2', tenantId: 'demo-tenant', employeeId, documentType: 'nda', documentName: 'Mutual_NDA_AuroraHR.pdf', fileSizeBytes: 98200, createdAt: new Date(2025, 11, 15).toISOString(), status: 'issued' as const, format: 'pdf' as const, updatedAt: new Date(2025, 11, 15).toISOString() },
              { documentId: 'doc-3', tenantId: 'demo-tenant', employeeId, documentType: 'code_of_conduct', documentName: 'AuroraHR_Code_of_Conduct_Signoff.pdf', fileSizeBytes: 205100, createdAt: new Date(2025, 11, 16).toISOString(), status: 'issued' as const, format: 'pdf' as const, updatedAt: new Date(2025, 11, 16).toISOString() }
            ]
          }
        };
      }
    }
  },

  approvals: {
    getPendingCount: async (_managerId: string) => {
      try {
        const [leavesRes, exitRes] = await Promise.all([
          api.get<any[]>('/leave/pending-approvals', { params: { status: 'pending' } }),
          api.get<any[]>('/exit/pending')
        ]);
        const leaveCount = leavesRes.success && leavesRes.data ? leavesRes.data.length : 0;
        const exitCount = exitRes.success && exitRes.data ? exitRes.data.length : 0;
        return {
          success: true,
          data: {
            total: leaveCount + exitCount,
            leaves: leaveCount,
            exits: exitCount
          }
        };
      } catch {
        return { success: true, data: { total: 2, leaves: 1, exits: 1 } };
      }
    }
  },

  pms: {
    goals: async (params?: { employeeId?: string; cycleId?: string }) => {
      try {
        const reviewsRes = await api.get<any[]>('/performance/reviews', { params });
        if (reviewsRes.success && reviewsRes.data && reviewsRes.data.length > 0) {
          const firstReview = reviewsRes.data[0];
          const reviewId = firstReview.reviewId;
          const goalsRes = await api.get<Goal[]>(`/performance/reviews/${reviewId}/goals`);
          return goalsRes;
        }
        return { success: true, data: [] };
      } catch (err) {
        console.warn('⚠️ PMS goals fetch failed, returning empty list:', err);
        return { success: true, data: [] };
      }
    },
    
    reviews: (params?: { employeeId?: string; cycleId?: string }) =>
      api.get<PerformanceReview[]>('/performance/reviews', { params }),
  },

  hrConnect: {
    posts: async (params?: { visibility?: string; groupId?: string }) => {
      try {
        const res = await api.get<any>('/hr-connect/posts', { params });
        if (res.success && res.data) {
          const rawPosts = res.data.posts || [];
          const mapped: HRPost[] = rawPosts.map((post: any) => ({
            ...post,
            authorName: post.author ? `${post.author.firstName} ${post.author.lastName}` : 'Unknown',
            authorDepartment: post.author?.department?.name,
            authorDesignation: post.author?.designation?.name,
            title: post.title || '',
          }));
          return { success: true, data: mapped };
        }
        return { success: true, data: _mockPosts };
      } catch (err) {
        console.warn('⚠️ Fetching HR Connect posts failed, returning mock data:', err);
        return { success: true, data: _mockPosts };
      }
    },

    createPost: async (data: Partial<HRPost>) => {
      try {
        const res = await api.post<any>('/hr-connect/posts', data);
        if (res.success && res.data) {
          return res;
        }
      } catch (err) {
        console.warn('⚠️ Creating post failed on server, creating in local mock store:', err);
      }
      // Create mock post fallback
      const newPost: HRPost = {
        postId: `p-mock-${Date.now()}`,
        authorId: data.authorId || 'e-1',
        authorName: data.authorName || 'Current Employee',
        authorAvatar: data.authorAvatar || 'https://ui-avatars.com/api/?name=Employee&background=0A66C2&color=fff',
        authorDepartment: data.authorDepartment || 'Engineering',
        authorDesignation: data.authorDesignation || 'Staff',
        title: data.title || '',
        content: data.content || '',
        postType: data.postType || 'general',
        visibility: data.visibility || 'public',
        groupId: data.groupId,
        isPinned: false,
        reactions: [],
        comments: [],
        createdAt: new Date().toISOString(),
      };
      _mockPosts = [newPost, ..._mockPosts];
      return { success: true, data: newPost };
    },

    deletePost: async (postId: string) => {
      try {
        const res = await api.delete(`/hr-connect/posts/${postId}`);
        if (res.success) return res;
      } catch (err) {
        console.warn('⚠️ Deleting post failed on server, deleting in local mock store:', err);
      }
      _mockPosts = _mockPosts.filter(p => p.postId !== postId);
      return { success: true, data: null };
    },

    addReaction: async (postId: string, reactionType: 'like' | 'love' | 'celebrate' | 'insightful', userFullName: string) => {
      try {
        await api.post(`/hr-connect/posts/${postId}/reactions`, { reactionType });
        return { success: true };
      } catch (err) {
        console.warn('⚠️ Reaction failed on server, toggling locally:', err);
      }
      
      const post = _mockPosts.find(p => p.postId === postId);
      if (post) {
        if (!post.reactions) post.reactions = [];
        // Check if user already reacted
        const existingIdx = post.reactions.findIndex(r => r.userId === 'e-current');
        if (existingIdx > -1) {
          post.reactions[existingIdx].reactionType = reactionType;
        } else {
          post.reactions.push({
            reactionId: `r-mock-${Date.now()}`,
            userId: 'e-current',
            userName: userFullName || 'Current User',
            reactionType,
            createdAt: new Date().toISOString()
          });
        }
      }
      return { success: true };
    },

    removeReaction: async (postId: string) => {
      try {
        await api.delete(`/hr-connect/posts/${postId}/reactions`);
        return { success: true };
      } catch (err) {
        console.warn('⚠️ Remove reaction failed on server, removing locally:', err);
      }
      
      const post = _mockPosts.find(p => p.postId === postId);
      if (post && post.reactions) {
        post.reactions = post.reactions.filter(r => r.userId !== 'e-current');
      }
      return { success: true };
    },

    comments: async (postId: string) => {
      try {
        const res = await api.get<any>(`/hr-connect/posts/${postId}/comments`);
        if (res.success && res.data) {
          return { success: true, data: res.data.comments || [] };
        }
      } catch (err) {
        console.warn('⚠️ Comments fetch failed on server, returning local comments:', err);
      }
      const post = _mockPosts.find(p => p.postId === postId);
      return { success: true, data: post?.comments || [] };
    },

    addComment: async (postId: string, content: string, userFullName: string) => {
      try {
        const res = await api.post<Comment>(`/hr-connect/posts/${postId}/comments`, { content });
        if (res.success && res.data) {
          return res;
        }
      } catch (err) {
        console.warn('⚠️ Post comment failed on server, posting locally:', err);
      }
      
      const newComment: Comment = {
        commentId: `c-mock-${Date.now()}`,
        postId,
        authorId: 'e-current',
        authorName: userFullName || 'Current User',
        content,
        createdAt: new Date().toISOString()
      };

      const post = _mockPosts.find(p => p.postId === postId);
      if (post) {
        if (!post.comments) post.comments = [];
        post.comments.push(newComment);
      }
      return { success: true, data: newComment };
    },

    deleteComment: async (commentId: string, postId: string) => {
      try {
        await api.delete(`/hr-connect/comments/${commentId}`);
        return { success: true };
      } catch (err) {
        console.warn('⚠️ Delete comment failed on server, deleting locally:', err);
      }
      const post = _mockPosts.find(p => p.postId === postId);
      if (post && post.comments) {
        post.comments = post.comments.filter(c => c.commentId !== commentId);
      }
      return { success: true };
    },

    groups: async () => {
      try {
        const res = await api.get<any>('/hr-connect/groups');
        if (res.success && res.data) {
          const rawGroups = res.data.groups || [];
          const mapped: Group[] = rawGroups.map((g: any) => ({
            ...g,
            groupType: g.groupType || g.type || 'topic',
            members: (g.members || []).map((m: any) => ({
              userId: m.employeeId,
              userName: m.employee ? `${m.employee.firstName} ${m.employee.lastName}` : 'Unknown',
              userEmail: m.employee?.email,
              role: m.role,
              joinedAt: m.joinedAt,
            })),
          }));
          return { success: true, data: mapped };
        }
        return { success: true, data: _mockGroups };
      } catch (err) {
        console.warn('⚠️ Groups fetch failed, returning mock groups:', err);
        return { success: true, data: _mockGroups };
      }
    },

    joinGroup: async (groupId: string) => {
      try {
        await api.post(`/hr-connect/groups/${groupId}/join`);
        return { success: true };
      } catch (err) {
        console.warn('⚠️ Join group failed on server, joining locally:', err);
      }
      _mockGroups = _mockGroups.map(g => {
        if (g.groupId === groupId) {
          return { ...g, memberCount: g.memberCount + 1 };
        }
        return g;
      });
      return { success: true };
    },

    leaveGroup: async (groupId: string) => {
      try {
        await api.post(`/hr-connect/groups/${groupId}/leave`);
        return { success: true };
      } catch (err) {
        console.warn('⚠️ Leave group failed on server, leaving locally:', err);
      }
      _mockGroups = _mockGroups.map(g => {
        if (g.groupId === groupId) {
          return { ...g, memberCount: Math.max(0, g.memberCount - 1) };
        }
        return g;
      });
      return { success: true };
    }
  }
};
