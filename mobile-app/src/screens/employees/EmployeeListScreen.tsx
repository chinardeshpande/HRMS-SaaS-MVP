import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { endpoints } from '../../api/endpoints';
import { Employee } from '../../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DirectoryStackParamList } from '../../navigation/types';

type ListNavProp = StackNavigationProp<DirectoryStackParamList, 'DirectoryList'>;

export const EmployeeListScreen: React.FC = () => {
  const navigation = useNavigation<ListNavProp>();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'engineering' | 'marketing' | 'sales'>('all');

  useEffect(() => {
    fetchEmployees();
  }, [search, activeFilter]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      // Best-effort endpoint call
      const res = await endpoints.employees.list({ search: search.trim() || undefined });
      if (res.success && res.data) {
        let filtered = res.data;
        // Mock filtering by department if actual department data is omitted
        if (activeFilter !== 'all') {
          filtered = filtered.filter(emp => {
            // Simulated matching
            const dept = (emp as any).departmentName?.toLowerCase() || '';
            return dept.includes(activeFilter);
          });
        }
        setEmployees(filtered);
      } else {
        // Mock standard employee directory for demonstration
        const mockEmployees: Employee[] = [
          { employeeId: '1', tenantId: 't1', employeeCode: 'EMP-001', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@acme.com', phone: '+91 98765 43210', status: 'active' as any, dateOfJoining: '2022-01-15', createdAt: '', updatedAt: '' },
          { employeeId: '2', tenantId: 't1', employeeCode: 'EMP-002', firstName: 'Michael', lastName: 'Chen', email: 'michael.chen@acme.com', phone: '+91 98765 43211', status: 'active' as any, dateOfJoining: '2023-03-10', createdAt: '', updatedAt: '' },
          { employeeId: '3', tenantId: 't1', employeeCode: 'EMP-003', firstName: 'Elena', lastName: 'Rostova', email: 'elena.rostova@acme.com', phone: '+91 98765 43212', status: 'active' as any, dateOfJoining: '2021-08-01', createdAt: '', updatedAt: '' },
          { employeeId: '4', tenantId: 't1', employeeCode: 'EMP-004', firstName: 'David', lastName: 'Kim', email: 'david.kim@acme.com', phone: '+91 98765 43213', status: 'active' as any, dateOfJoining: '2024-02-18', createdAt: '', updatedAt: '' },
        ];
        
        // Populate mock names for additional attributes
        const processed = mockEmployees.map((e, idx) => ({
          ...e,
          designationName: idx === 0 ? 'Lead HR Specialist' : idx === 1 ? 'Senior Frontend Engineer' : idx === 2 ? 'VP of Marketing' : 'Sales Director',
          departmentName: idx === 0 ? 'HR & Talent' : idx === 1 ? 'Engineering' : idx === 2 ? 'Marketing' : 'Sales'
        }));

        let filtered = processed;
        if (search) {
          filtered = filtered.filter(emp => 
            `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase())
          );
        }
        if (activeFilter !== 'all') {
          filtered = filtered.filter(emp => 
            emp.departmentName.toLowerCase().includes(activeFilter)
          );
        }
        setEmployees(filtered);
      }
    } catch (err) {
      console.warn('⚠️ Failed to fetch employees list:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderEmployeeItem = ({ item }: { item: Employee }) => {
    const fullName = `${item.firstName} ${item.lastName}`;
    const dept = (item as any).departmentName || 'General';
    const des = (item as any).designationName || 'Associate';

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('EmployeeDetail', { employeeId: item.employeeId })}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0A66C2&color=fff&size=100&bold=true` }}
          style={styles.avatar}
        />
        
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.designation}>{des}</Text>
          
          <View style={styles.badgeRow}>
            <View style={styles.deptBadge}>
              <Text style={styles.deptText}>{dept}</Text>
            </View>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>{item.employeeCode}</Text>
            </View>
          </View>
        </View>

        <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" style={styles.arrowIcon} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={22} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by employee name..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearIcon}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Pills */}
        <View style={styles.pillContainer}>
          {(['all', 'engineering', 'marketing', 'sales'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.pill, activeFilter === filter && styles.pillActive]}
              onPress={() => setActiveFilter(filter)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, activeFilter === filter && styles.pillTextActive]}>
                {filter.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Directory List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A66C2" />
          <Text style={styles.loadingText}>Searching directory...</Text>
        </View>
      ) : employees.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-search-outline" size={56} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No Employees Found</Text>
          <Text style={styles.emptyDesc}>Try adjusting your search criteria or filter tags</Text>
        </View>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(item) => item.employeeId}
          renderItem={renderEmployeeItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  clearIcon: {
    padding: 4,
  },
  pillContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pillActive: {
    backgroundColor: '#e8f4f8',
    borderColor: 'rgba(10, 102, 194, 0.2)',
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
  },
  pillTextActive: {
    color: '#0A66C2',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  designation: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 2,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  deptBadge: {
    backgroundColor: '#e8f4f8',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  deptText: {
    color: '#0A66C2',
    fontSize: 10,
    fontWeight: '700',
  },
  codeBadge: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  codeText: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '600',
  },
  arrowIcon: {
    marginLeft: 8,
  },
  loadingContainer: {
    paddingVertical: 100,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#4b5563',
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1f2937',
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
});
