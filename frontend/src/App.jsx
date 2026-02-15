import React, { useState, useEffect } from 'react';
import { Users, Calendar, BarChart3, Plus, Download, Edit2, Trash2, Save, X, LogOut, User, ChevronDown, ChevronRight } from 'lucide-react';
import Login from './Login';

const API_URL = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

const handleAuthError = (response) => {
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.reload();
  }
  return response;
};

const api = {
  getPeople: () => fetch(`${API_URL}/people`, {
    headers: getAuthHeaders()
  }).then(handleAuthError).then(r => r.json()),

  addPerson: (person) => fetch(`${API_URL}/people`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(person)
  }).then(handleAuthError).then(r => r.json()),

  addBulkPeople: (people) => fetch(`${API_URL}/people/bulk`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ people })
  }).then(handleAuthError).then(r => r.json()),

  updatePerson: (id, person) => fetch(`${API_URL}/people/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(person)
  }).then(handleAuthError).then(r => r.json()),

  deletePerson: (id) => fetch(`${API_URL}/people/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  }).then(handleAuthError).then(r => r.json()),

  getEvents: () => fetch(`${API_URL}/events`, {
    headers: getAuthHeaders()
  }).then(handleAuthError).then(r => r.json()),

  addEvent: (event) => fetch(`${API_URL}/events`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(event)
  }).then(handleAuthError).then(r => r.json()),

  addBulkEvents: (events) => fetch(`${API_URL}/events/bulk`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ events })
  }).then(handleAuthError).then(r => r.json()),

  updateEvent: (id, event) => fetch(`${API_URL}/events/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(event)
  }).then(handleAuthError).then(r => r.json()),

  deleteEvent: (id) => fetch(`${API_URL}/events/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  }).then(handleAuthError).then(r => r.json()),

  getAttendance: () => fetch(`${API_URL}/attendance`, {
    headers: getAuthHeaders()
  }).then(handleAuthError).then(r => r.json()),

  setAttendance: (attendance) => fetch(`${API_URL}/attendance`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(attendance)
  }).then(handleAuthError).then(r => r.json()),

  deleteAttendance: (personId, eventId) => fetch(`${API_URL}/attendance/${personId}/${eventId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  }).then(handleAuthError).then(r => r.json())
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState('attendance');
  const [people, setPeople] = useState([]);
  const [events, setEvents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  const [newPerson, setNewPerson] = useState({ name: '', hireDate: '', endDate: '', department: '' });
  const [bulkPeople, setBulkPeople] = useState('');
  const [newEvent, setNewEvent] = useState({ name: '', type: '', date: '' });
  const [bulkEvents, setBulkEvents] = useState('');
  const [reportFilter, setReportFilter] = useState({ period: 'all', department: 'all', startDate: '', endDate: '' });
  const [editingPerson, setEditingPerson] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedPersonForReport, setSelectedPersonForReport] = useState(null);
  const [expandedDepts, setExpandedDepts] = useState([]);

  const isPersonActiveForEvent = (person, eventDate) => {
    const event = new Date(eventDate);
    const hire = new Date(person.hireDate);
    const end = person.endDate ? new Date(person.endDate) : null;
    
    return event >= hire && (!end || event <= end);
  };

  const activePeopleForEvent = (eventDate) => {
    return people.filter(p => isPersonActiveForEvent(p, eventDate));
  };

  const departments = [...new Set(people.map(p => p.department))];
  const eventTypes = [...new Set(events.map(e => e.type))];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUsername = localStorage.getItem('username');
    if (token && savedUsername) {
      setIsAuthenticated(true);
      setUsername(savedUsername);
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (token, user) => {
    setIsAuthenticated(true);
    setUsername(user);
    loadData();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUsername('');
    setPeople([]);
    setEvents([]);
    setAttendance([]);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [peopleData, eventsData, attendanceData] = await Promise.all([
        api.getPeople(),
        api.getEvents(),
        api.getAttendance()
      ]);
      setPeople(peopleData.map(p => ({
        id: p.id,
        name: p.name,
        hireDate: p.hire_date,
        endDate: p.end_date,
        department: p.department
      })));
      setEvents(eventsData);
      setAttendance(attendanceData.map(a => ({
        id: a.id,
        personId: a.person_id,
        eventId: a.event_id,
        status: a.status
      })));
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data. Make sure the backend server is running on http://localhost:3001');
    } finally {
      setLoading(false);
    }
  };

  const addPerson = async () => {
    if (newPerson.name && newPerson.hireDate && newPerson.department) {
      try {
        const result = await api.addPerson(newPerson);
        setPeople([...people, result]);
        setNewPerson({ name: '', hireDate: '', endDate: '', department: '' });
      } catch (error) {
        console.error('Error adding person:', error);
      }
    }
  };

  const addBulkPeople = async () => {
    const lines = bulkPeople.trim().split('\n');
    const newPeopleList = [];
    
    lines.forEach(line => {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 3 && parts[0] && parts[1] && parts[2]) {
        newPeopleList.push({
          name: parts[0],
          hireDate: parts[1],
          department: parts[2],
          endDate: parts[3] || ''
        });
      }
    });
    
    if (newPeopleList.length > 0) {
      try {
        await api.addBulkPeople(newPeopleList);
        await loadData();
        setBulkPeople('');
      } catch (error) {
        console.error('Error adding bulk people:', error);
      }
    }
  };

  const addEvent = async () => {
    if (newEvent.name && newEvent.type && newEvent.date) {
      try {
        const result = await api.addEvent(newEvent);
        setEvents([...events, result]);
        setNewEvent({ name: '', type: '', date: '' });
      } catch (error) {
        console.error('Error adding event:', error);
      }
    }
  };

  const addBulkEvents = async () => {
    const lines = bulkEvents.trim().split('\n');
    const newEventsList = [];
    
    lines.forEach(line => {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 3 && parts[0] && parts[1] && parts[2]) {
        newEventsList.push({
          name: parts[0],
          type: parts[1],
          date: parts[2]
        });
      }
    });
    
    if (newEventsList.length > 0) {
      try {
        await api.addBulkEvents(newEventsList);
        await loadData();
        setBulkEvents('');
      } catch (error) {
        console.error('Error adding bulk events:', error);
      }
    }
  };

  const deletePerson = async (id) => {
    if (window.confirm('Delete this person? Their attendance records will also be removed.')) {
      try {
        await api.deletePerson(id);
        setPeople(people.filter(p => p.id !== id));
        setAttendance(attendance.filter(a => a.personId !== id));
      } catch (error) {
        console.error('Error deleting person:', error);
      }
    }
  };

  const deleteEvent = async (id) => {
    if (window.confirm('Delete this event? All attendance records for this event will be removed.')) {
      try {
        await api.deleteEvent(id);
        setEvents(events.filter(e => e.id !== id));
        setAttendance(attendance.filter(a => a.eventId !== id));
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const saveEditPerson = async () => {
    try {
      await api.updatePerson(editingPerson.id, editingPerson);
      setPeople(people.map(p => p.id === editingPerson.id ? editingPerson : p));
      setEditingPerson(null);
    } catch (error) {
      console.error('Error updating person:', error);
    }
  };

  const saveEditEvent = async () => {
    try {
      await api.updateEvent(editingEvent.id, editingEvent);
      setEvents(events.map(e => e.id === editingEvent.id ? editingEvent : e));
      setEditingEvent(null);
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const toggleAttendance = async (personId, eventId, status) => {
    const existing = attendance.find(a => a.personId === personId && a.eventId === eventId);
    
    try {
      if (existing) {
        if (existing.status === status) {
          await api.deleteAttendance(personId, eventId);
          setAttendance(attendance.filter(a => !(a.personId === personId && a.eventId === eventId)));
        } else {
          await api.setAttendance({ personId, eventId, status });
          setAttendance(attendance.map(a => 
            a.personId === personId && a.eventId === eventId ? { ...a, status } : a
          ));
        }
      } else {
        const result = await api.setAttendance({ personId, eventId, status });
        setAttendance([...attendance, { id: result.id, personId, eventId, status }]);
      }
    } catch (error) {
      console.error('Error toggling attendance:', error);
    }
  };

  const markAllForEvent = async (eventId, status) => {
    const event = events.find(e => e.id === eventId);
    const activePeople = activePeopleForEvent(event.date);
    
    try {
      for (const person of activePeople) {
        await api.setAttendance({ personId: person.id, eventId, status });
      }
      await loadData();
    } catch (error) {
      console.error('Error marking all:', error);
    }
  };

  const getAttendanceStatus = (personId, eventId) => {
    const record = attendance.find(a => a.personId === personId && a.eventId === eventId);
    return record?.status || null;
  };

  const filterEventsByPeriod = (events) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return events.filter(event => {
      const eventDate = new Date(event.date);
      switch (reportFilter.period) {
        case 'month':
          return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
        case 'ytd':
          return eventDate.getFullYear() === currentYear;
        case 'lastMonth': {
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return eventDate.getMonth() === lastMonth && eventDate.getFullYear() === lastMonthYear;
        }
        case 'last3Months': {
          const threeMonthsAgo = new Date(now);
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          return eventDate >= threeMonthsAgo && eventDate <= now;
        }
        case 'last6Months': {
          const sixMonthsAgo = new Date(now);
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          return eventDate >= sixMonthsAgo && eventDate <= now;
        }
        case 'lastYear':
          return eventDate.getFullYear() === currentYear - 1;
        case 'last2Years': {
          const twoYearsAgo = new Date(now);
          twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
          return eventDate >= twoYearsAgo && eventDate <= now;
        }
        case 'custom': {
          const start = reportFilter.startDate ? new Date(reportFilter.startDate) : null;
          const end = reportFilter.endDate ? new Date(reportFilter.endDate) : null;
          if (start && end) return eventDate >= start && eventDate <= end;
          if (start) return eventDate >= start;
          if (end) return eventDate <= end;
          return true;
        }
        case 'all':
        default:
          return true;
      }
    });
  };

  const calculateAttendanceStats = () => {
    const filteredEvents = filterEventsByPeriod(events);
    const stats = {};
    
    eventTypes.forEach(type => {
      const typeEvents = filteredEvents.filter(e => e.type === type);
      let present = 0, absent = 0, excused = 0, noRecord = 0;
      let totalSlots = 0;
      
      typeEvents.forEach(event => {
        const activePeople = activePeopleForEvent(event.date).filter(p => 
          reportFilter.department === 'all' || p.department === reportFilter.department
        );
        totalSlots += activePeople.length;
        
        activePeople.forEach(person => {
          const status = getAttendanceStatus(person.id, event.id);
          if (status === 'present') present++;
          else if (status === 'absent') absent++;
          else if (status === 'excused') excused++;
          else noRecord++;
        });
      });

      const attendableSlots = totalSlots - excused;
      const attendanceRate = attendableSlots > 0 ? (present / attendableSlots * 100) : 0;

      stats[type] = {
        totalEvents: typeEvents.length,
        present,
        absent,
        excused,
        noRecord,
        attendanceRate: attendanceRate.toFixed(1)
      };
    });

    return stats;
  };

  const calculateDepartmentStats = () => {
    const filteredEvents = filterEventsByPeriod(events);
    const stats = {};

    departments.forEach(dept => {
      let present = 0, absent = 0, excused = 0;
      let totalSlots = 0;
      const byType = {};

      filteredEvents.forEach(event => {
        const deptPeople = activePeopleForEvent(event.date).filter(p => p.department === dept);
        totalSlots += deptPeople.length;

        if (!byType[event.type]) {
          byType[event.type] = { totalEvents: 0, present: 0, absent: 0, excused: 0 };
        }
        byType[event.type].totalEvents++;

        deptPeople.forEach(person => {
          const status = getAttendanceStatus(person.id, event.id);
          if (status === 'present') { present++; byType[event.type].present++; }
          else if (status === 'absent') { absent++; byType[event.type].absent++; }
          else if (status === 'excused') { excused++; byType[event.type].excused++; }
        });
      });

      // Calculate rate for each event type
      Object.values(byType).forEach(t => {
        const attendable = (t.present + t.absent + t.excused) - t.excused;
        t.attendanceRate = attendable > 0 ? (t.present / attendable * 100).toFixed(1) : '0.0';
      });

      const attendableSlots = totalSlots - excused;
      const attendanceRate = attendableSlots > 0 ? (present / attendableSlots * 100) : 0;

      stats[dept] = {
        people: people.filter(p => p.department === dept).length,
        present,
        absent,
        excused,
        attendanceRate: attendanceRate.toFixed(1),
        byType
      };
    });

    return stats;
  };

  const getPeriodLabel = () => {
    const labels = {
      month: 'Current Month',
      ytd: 'Year to Date',
      lastMonth: 'Last Month',
      last3Months: 'Last 3 Months',
      last6Months: 'Last 6 Months',
      lastYear: 'Last Year',
      last2Years: 'Last 2 Years',
      all: 'All Time',
    };
    if (reportFilter.period === 'custom') {
      const from = reportFilter.startDate || 'beginning';
      const to = reportFilter.endDate || 'present';
      return `Custom: ${from} to ${to}`;
    }
    return labels[reportFilter.period] || 'All Time';
  };

  const exportReport = () => {
    const stats = calculateAttendanceStats();
    const deptStats = calculateDepartmentStats();

    let csv = 'Attendance Report\n\n';
    csv += `Period: ${getPeriodLabel()}\n`;
    csv += `Department: ${reportFilter.department === 'all' ? 'All Departments' : reportFilter.department}\n\n`;

    csv += 'By Event Type\n';
    csv += 'Type,Events,Present,Absent,Excused,No Record,Attendance Rate\n';
    Object.entries(stats).forEach(([type, data]) => {
      csv += `${type},${data.totalEvents},${data.present},${data.absent},${data.excused},${data.noRecord},${data.attendanceRate}%\n`;
    });

    csv += '\nBy Department\n';
    csv += 'Department,People/Events,Present,Absent,Excused,Attendance Rate\n';
    Object.entries(deptStats).forEach(([dept, data]) => {
      csv += `${dept},${data.people},${data.present},${data.absent},${data.excused},${data.attendanceRate}%\n`;
      Object.entries(data.byType).forEach(([type, typeData]) => {
        csv += `  ${type},${typeData.totalEvents} events,${typeData.present},${typeData.absent},${typeData.excused},${typeData.attendanceRate}%\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance-report.csv';
    a.click();
  };

  const calculateIndividualReport = (personId) => {
    if (!personId) return null;

    const person = people.find(p => p.id === personId);
    if (!person) return null;

    const eligibleEvents = filterEventsByPeriod(events).filter(e => isPersonActiveForEvent(person, e.date));

    let present = 0, absent = 0, excused = 0, noRecord = 0;
    const eventRecords = [];

    eligibleEvents.forEach(event => {
      const status = getAttendanceStatus(personId, event.id);
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
      else if (status === 'excused') excused++;
      else noRecord++;

      eventRecords.push({
        ...event,
        status: status || 'No Record'
      });
    });

    const attendableEvents = eligibleEvents.length - excused;
    const attendanceRate = attendableEvents > 0 ? (present / attendableEvents * 100) : 0;

    return {
      person,
      totalEvents: eligibleEvents.length,
      present,
      absent,
      excused,
      noRecord,
      attendanceRate: attendanceRate.toFixed(1),
      eventRecords: eventRecords.sort((a, b) => new Date(b.date) - new Date(a.date))
    };
  };

  const exportIndividualReport = () => {
    if (!selectedPersonForReport) return;

    const report = calculateIndividualReport(selectedPersonForReport);
    if (!report) return;

    let csv = `Individual Attendance Report\n\n`;
    csv += `Period: ${getPeriodLabel()}\n`;
    csv += `Name: ${report.person.name}\n`;
    csv += `Department: ${report.person.department}\n`;
    csv += `Hire Date: ${report.person.hireDate}\n`;
    if (report.person.endDate) {
      csv += `End Date: ${report.person.endDate}\n`;
    }
    csv += `\nSummary\n`;
    csv += `Total Events: ${report.totalEvents}\n`;
    csv += `Present: ${report.present}\n`;
    csv += `Absent: ${report.absent}\n`;
    csv += `Excused: ${report.excused}\n`;
    csv += `No Record: ${report.noRecord}\n`;
    csv += `Attendance Rate: ${report.attendanceRate}%\n\n`;

    csv += 'Event Details\n';
    csv += 'Date,Event Name,Type,Status\n';
    report.eventRecords.forEach(event => {
      csv += `${event.date},${event.name},${event.type},${event.status}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.person.name.replace(/\s+/g, '_')}_attendance_report.csv`;
    a.click();
  };

  const displayPeople = showInactive ? people : people.filter(p => !p.endDate || new Date(p.endDate) >= new Date());

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-xl">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Attendance Tracking System</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-700">
              <User size={18} />
              <span className="text-sm">{username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
        
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 font-medium ${activeTab === 'attendance' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          >
            <Calendar className="inline mr-2" size={18} />
            Attendance
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={`px-4 py-2 font-medium ${activeTab === 'people' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          >
            <Users className="inline mr-2" size={18} />
            People
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 font-medium ${activeTab === 'events' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          >
            <Calendar className="inline mr-2" size={18} />
            Events
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 font-medium ${activeTab === 'reports' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          >
            <BarChart3 className="inline mr-2" size={18} />
            Reports
          </button>
          <button
            onClick={() => setActiveTab('individual')}
            className={`px-4 py-2 font-medium ${activeTab === 'individual' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          >
            <User className="inline mr-2" size={18} />
            Individual
          </button>
        </div>

        {activeTab === 'attendance' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Mark Attendance</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Person</th>
                    {events.map(event => (
                      <th key={event.id} className="text-center p-2 min-w-32">
                        <div className="font-semibold">{event.name}</div>
                        <div className="text-xs text-gray-500">{event.type} - {event.date}</div>
                        <div className="flex gap-1 justify-center mt-1">
                          <button
                            onClick={() => markAllForEvent(event.id, 'present')}
                            className="text-xs px-1 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            All P
                          </button>
                          <button
                            onClick={() => markAllForEvent(event.id, 'absent')}
                            className="text-xs px-1 py-0.5 bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            All A
                          </button>
                          <button
                            onClick={() => markAllForEvent(event.id, 'excused')}
                            className="text-xs px-1 py-0.5 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                          >
                            All E
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {people.map(person => (
                    <tr key={person.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div className="font-medium">{person.name}</div>
                        <div className="text-xs text-gray-500">
                          {person.department}
                          {person.endDate && <span className="text-red-600 ml-2">(Ended: {person.endDate})</span>}
                        </div>
                      </td>
                      {events.map(event => {
                        const status = getAttendanceStatus(person.id, event.id);
                        const isActive = isPersonActiveForEvent(person, event.date);
                        return (
                          <td key={event.id} className="p-2 text-center">
                            {isActive ? (
                              <div className="flex gap-1 justify-center">
                                <button
                                  onClick={() => toggleAttendance(person.id, event.id, 'present')}
                                  className={`px-2 py-1 rounded text-xs ${status === 'present' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                                >
                                  P
                                </button>
                                <button
                                  onClick={() => toggleAttendance(person.id, event.id, 'absent')}
                                  className={`px-2 py-1 rounded text-xs ${status === 'absent' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                                >
                                  A
                                </button>
                                <button
                                  onClick={() => toggleAttendance(person.id, event.id, 'excused')}
                                  className={`px-2 py-1 rounded text-xs ${status === 'excused' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                                >
                                  E
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">N/A</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'people' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Manage People</h2>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Show inactive</span>
              </label>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">Add New Person</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={newPerson.name}
                  onChange={(e) => setNewPerson({...newPerson, name: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded"
                />
                <input
                  type="date"
                  placeholder="Hire Date"
                  value={newPerson.hireDate}
                  onChange={(e) => setNewPerson({...newPerson, hireDate: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded"
                />
                <input
                  type="date"
                  placeholder="End Date (optional)"
                  value={newPerson.endDate}
                  onChange={(e) => setNewPerson({...newPerson, endDate: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  placeholder="Department"
                  value={newPerson.department}
                  onChange={(e) => setNewPerson({...newPerson, department: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded"
                />
                <button
                  onClick={addPerson}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <Plus className="inline mr-1" size={16} />
                  Add
                </button>
              </div>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">Add Multiple People</h3>
              <p className="text-sm text-gray-600 mb-2">Enter one person per line: Name, Hire Date, Department, End Date (optional)</p>
              <p className="text-xs text-gray-500 mb-2">Example: John Doe, 2023-01-15, Engineering, 2024-12-31</p>
              <textarea
                value={bulkPeople}
                onChange={(e) => setBulkPeople(e.target.value)}
                placeholder="John Doe, 2023-01-15, Engineering
Jane Smith, 2023-02-01, Sales, 2024-06-30"
                className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                rows="4"
              />
              <button
                onClick={addBulkPeople}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <Plus className="inline mr-1" size={16} />
                Add All
              </button>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Hire Date</th>
                  <th className="text-left p-2">End Date</th>
                  <th className="text-left p-2">Department</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-right p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayPeople.map(person => (
                  <tr key={person.id} className="border-b hover:bg-gray-50">
                    {editingPerson?.id === person.id ? (
                      <>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editingPerson.name}
                            onChange={(e) => setEditingPerson({...editingPerson, name: e.target.value})}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="date"
                            value={editingPerson.hireDate}
                            onChange={(e) => setEditingPerson({...editingPerson, hireDate: e.target.value})}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="date"
                            value={editingPerson.endDate || ''}
                            onChange={(e) => setEditingPerson({...editingPerson, endDate: e.target.value})}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editingPerson.department}
                            onChange={(e) => setEditingPerson({...editingPerson, department: e.target.value})}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="p-2"></td>
                        <td className="p-2 text-right">
                          <button
                            onClick={saveEditPerson}
                            className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 mr-1"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={() => setEditingPerson(null)}
                            className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2">{person.name}</td>
                        <td className="p-2">{person.hireDate}</td>
                        <td className="p-2">{person.endDate || '-'}</td>
                        <td className="p-2">{person.department}</td>
                        <td className="p-2">
                          {person.endDate && new Date(person.endDate) < new Date() ? (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">Inactive</span>
                          ) : (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Active</span>
                          )}
                        </td>
                        <td className="p-2 text-right">
                          <button
                            onClick={() => setEditingPerson(person)}
                            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 mr-1"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deletePerson(person.id)}
                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Manage Events</h2>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">Add New Event</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Event Name"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  placeholder="Type (e.g., Meeting, Training)"
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded"
                />
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded"
                />
                <button
                  onClick={addEvent}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <Plus className="inline mr-1" size={16} />
                  Add Event
                </button>
              </div>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">Add Multiple Events</h3>
              <p className="text-sm text-gray-600 mb-2">Enter one event per line: Name, Type, Date</p>
              <p className="text-xs text-gray-500 mb-2">Example: Weekly Standup, Meeting, 2025-01-20</p>
              <textarea
                value={bulkEvents}
                onChange={(e) => setBulkEvents(e.target.value)}
                placeholder="Weekly Standup, Meeting, 2025-01-20
Product Training, Training, 2025-01-25"
                className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                rows="4"
              />
              <button
                onClick={addBulkEvents}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <Plus className="inline mr-1" size={16} />
                Add All Events
              </button>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Event Name</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-right p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id} className="border-b hover:bg-gray-50">
                    {editingEvent?.id === event.id ? (
                      <>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editingEvent.name}
                            onChange={(e) => setEditingEvent({...editingEvent, name: e.target.value})}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editingEvent.type}
                            onChange={(e) => setEditingEvent({...editingEvent, type: e.target.value})}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="date"
                            value={editingEvent.date}
                            onChange={(e) => setEditingEvent({...editingEvent, date: e.target.value})}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <button
                            onClick={saveEditEvent}
                            className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 mr-1"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={() => setEditingEvent(null)}
                            className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2">{event.name}</td>
                        <td className="p-2">{event.type}</td>
                        <td className="p-2">{event.date}</td>
                        <td className="p-2 text-right">
                          <button
                            onClick={() => setEditingEvent(event)}
                            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 mr-1"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Attendance Reports</h2>
                <button
                  onClick={exportReport}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  <Download className="inline mr-1" size={16} />
                  Export CSV
                </button>
              </div>

              <div className="flex flex-wrap gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Period</label>
                  <select
                    value={reportFilter.period}
                    onChange={(e) => setReportFilter({...reportFilter, period: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="month">Current Month</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="last3Months">Last 3 Months</option>
                    <option value="last6Months">Last 6 Months</option>
                    <option value="ytd">Year to Date</option>
                    <option value="lastYear">Last Year</option>
                    <option value="last2Years">Last 2 Years</option>
                    <option value="all">All Time</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                {reportFilter.period === 'custom' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">From</label>
                      <input
                        type="date"
                        value={reportFilter.startDate}
                        onChange={(e) => setReportFilter({...reportFilter, startDate: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">To</label>
                      <input
                        type="date"
                        value={reportFilter.endDate}
                        onChange={(e) => setReportFilter({...reportFilter, endDate: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <select
                    value={reportFilter.department}
                    onChange={(e) => setReportFilter({...reportFilter, department: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-semibold text-lg mb-3">Attendance by Event Type</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Event Type</th>
                      <th className="text-right p-2">Events</th>
                      <th className="text-right p-2">Present</th>
                      <th className="text-right p-2">Absent</th>
                      <th className="text-right p-2">Excused</th>
                      <th className="text-right p-2">No Record</th>
                      <th className="text-right p-2">Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(calculateAttendanceStats()).map(([type, stats]) => (
                      <tr key={type} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{type}</td>
                        <td className="p-2 text-right">{stats.totalEvents}</td>
                        <td className="p-2 text-right text-green-600">{stats.present}</td>
                        <td className="p-2 text-right text-red-600">{stats.absent}</td>
                        <td className="p-2 text-right text-yellow-600">{stats.excused}</td>
                        <td className="p-2 text-right text-gray-500">{stats.noRecord}</td>
                        <td className="p-2 text-right font-semibold">{stats.attendanceRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Attendance by Department</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Department</th>
                      <th className="text-right p-2">People</th>
                      <th className="text-right p-2">Present</th>
                      <th className="text-right p-2">Absent</th>
                      <th className="text-right p-2">Excused</th>
                      <th className="text-right p-2">Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(calculateDepartmentStats()).map(([dept, stats]) => {
                      const isExpanded = expandedDepts.includes(dept);
                      return (
                        <React.Fragment key={dept}>
                          <tr
                            className="border-b hover:bg-gray-50 cursor-pointer"
                            onClick={() => setExpandedDepts(isExpanded
                              ? expandedDepts.filter(d => d !== dept)
                              : [...expandedDepts, dept]
                            )}
                          >
                            <td className="p-2 font-medium">
                              <span className="inline-flex items-center gap-1">
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                {dept}
                              </span>
                            </td>
                            <td className="p-2 text-right">{stats.people}</td>
                            <td className="p-2 text-right text-green-600">{stats.present}</td>
                            <td className="p-2 text-right text-red-600">{stats.absent}</td>
                            <td className="p-2 text-right text-yellow-600">{stats.excused}</td>
                            <td className="p-2 text-right font-semibold">{stats.attendanceRate}%</td>
                          </tr>
                          {isExpanded && Object.entries(stats.byType).map(([type, typeStats]) => (
                            <tr key={`${dept}-${type}`} className="border-b bg-gray-50">
                              <td className="p-2 pl-10 text-sm text-gray-600">{type}</td>
                              <td className="p-2 text-right text-sm text-gray-500">{typeStats.totalEvents} events</td>
                              <td className="p-2 text-right text-sm text-green-600">{typeStats.present}</td>
                              <td className="p-2 text-right text-sm text-red-600">{typeStats.absent}</td>
                              <td className="p-2 text-right text-sm text-yellow-600">{typeStats.excused}</td>
                              <td className="p-2 text-right text-sm font-medium">{typeStats.attendanceRate}%</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'individual' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Individual Attendance Report</h2>
              {selectedPersonForReport && (
                <button
                  onClick={exportIndividualReport}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  <Download className="inline mr-1" size={16} />
                  Export CSV
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mb-6 items-end">
              <div>
                <label className="block text-sm font-medium mb-1">Select Person</label>
                <select
                  value={selectedPersonForReport || ''}
                  onChange={(e) => setSelectedPersonForReport(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="">Choose a person...</option>
                  {people.map(person => (
                    <option key={person.id} value={person.id}>
                      {person.name} - {person.department}
                      {person.endDate && ` (Ended: ${person.endDate})`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Period</label>
                <select
                  value={reportFilter.period}
                  onChange={(e) => setReportFilter({...reportFilter, period: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="month">Current Month</option>
                  <option value="lastMonth">Last Month</option>
                  <option value="last3Months">Last 3 Months</option>
                  <option value="last6Months">Last 6 Months</option>
                  <option value="ytd">Year to Date</option>
                  <option value="lastYear">Last Year</option>
                  <option value="last2Years">Last 2 Years</option>
                  <option value="all">All Time</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              {reportFilter.period === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">From</label>
                    <input
                      type="date"
                      value={reportFilter.startDate}
                      onChange={(e) => setReportFilter({...reportFilter, startDate: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">To</label>
                    <input
                      type="date"
                      value={reportFilter.endDate}
                      onChange={(e) => setReportFilter({...reportFilter, endDate: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                </>
              )}
            </div>

            {selectedPersonForReport && (() => {
              const report = calculateIndividualReport(selectedPersonForReport);
              if (!report) return null;

              return (
                <div>
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">{report.person.name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Department</div>
                        <div className="font-medium">{report.person.department}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Hire Date</div>
                        <div className="font-medium">{report.person.hireDate}</div>
                      </div>
                      {report.person.endDate && (
                        <div>
                          <div className="text-sm text-gray-600">End Date</div>
                          <div className="font-medium text-red-600">{report.person.endDate}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="p-4 bg-gray-100 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Total Events</div>
                      <div className="text-2xl font-bold">{report.totalEvents}</div>
                    </div>
                    <div className="p-4 bg-green-100 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Present</div>
                      <div className="text-2xl font-bold text-green-600">{report.present}</div>
                    </div>
                    <div className="p-4 bg-red-100 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Absent</div>
                      <div className="text-2xl font-bold text-red-600">{report.absent}</div>
                    </div>
                    <div className="p-4 bg-yellow-100 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Excused</div>
                      <div className="text-2xl font-bold text-yellow-600">{report.excused}</div>
                    </div>
                    <div className="p-4 bg-blue-100 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Attendance Rate</div>
                      <div className="text-2xl font-bold text-blue-600">{report.attendanceRate}%</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Event History</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Date</th>
                            <th className="text-left p-2">Event Name</th>
                            <th className="text-left p-2">Type</th>
                            <th className="text-center p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.eventRecords.map(event => (
                            <tr key={event.id} className="border-b hover:bg-gray-50">
                              <td className="p-2">{event.date}</td>
                              <td className="p-2">{event.name}</td>
                              <td className="p-2">{event.type}</td>
                              <td className="p-2 text-center">
                                <span className={`px-3 py-1 rounded text-sm font-medium ${
                                  event.status === 'present' ? 'bg-green-100 text-green-700' :
                                  event.status === 'absent' ? 'bg-red-100 text-red-700' :
                                  event.status === 'excused' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {event.status === 'present' ? 'Present' :
                                   event.status === 'absent' ? 'Absent' :
                                   event.status === 'excused' ? 'Excused' : 'No Record'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;