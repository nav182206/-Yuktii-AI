/**
 * Mock implementation of the Email Campaign Management APIs
 * In a real scenario, these would call the endpoints described in Section 5.2
 */

export interface Customer {
  id: string;
  name: string;
  email: string;
  demographics: {
    age: number;
    gender: string;
    location: string;
    status: 'active' | 'inactive';
  };
}

export async function getCustomerCohort(): Promise<Customer[]> {
  // Simulate API call
  return [
    { id: '1', name: 'John Doe', email: 'john@example.com', demographics: { age: 45, gender: 'male', location: 'New York', status: 'active' } },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', demographics: { age: 65, gender: 'female', location: 'London', status: 'active' } },
    { id: '3', name: 'Bob Wilson', email: 'bob@example.com', demographics: { age: 30, gender: 'male', location: 'San Francisco', status: 'inactive' } },
    { id: '4', name: 'Alice Brown', email: 'alice@example.com', demographics: { age: 70, gender: 'female', location: 'Chicago', status: 'active' } },
  ];
}

export async function scheduleCampaign(variantId: string, details: any) {
  console.log(`Scheduling campaign variant ${variantId}:`, details);
  // Simulate API call
  return { success: true, jobId: Math.random().toString(36).substring(7) };
}

export async function getPerformanceReport(variantId: string) {
  // Simulate API call with gamified metrics
  return {
    opens: Math.floor(Math.random() * 1000),
    clicks: Math.floor(Math.random() * 200),
    timestamp: new Date().toISOString()
  };
}

export async function getHistoricalPerformance() {
  // Simulate time-series data for the last 7 days
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(day => ({
    name: day,
    opens: Math.floor(Math.random() * 5000) + 2000,
    clicks: Math.floor(Math.random() * 1000) + 500,
  }));
}

export async function getSegmentEngagement() {
  return [
    { segment: 'Senior Citizens', openRate: 0.65, clickRate: 0.25 },
    { segment: 'Young Professionals', openRate: 0.45, clickRate: 0.15 },
    { segment: 'Female Customers', openRate: 0.72, clickRate: 0.30 },
    { segment: 'Inactive Users', openRate: 0.20, clickRate: 0.05 },
  ];
}
