import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import { formatVnd } from '../../utils';
import toast from 'react-hot-toast';

type AdminTab = 'overview' | 'tasks' | 'certificates' | 'payments' | 'disputes';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<any | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [suspiciousTasks, setSuspiciousTasks] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = String(user?.role || '').toUpperCase() === 'ADMIN';

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, tasksRes, suspiciousRes, certsRes, paymentsRes] = await Promise.all([
        api.admin.getStats(),
        api.admin.getTasks(),
        api.admin.getSuspiciousTasks(),
        api.admin.getCertificates(),
        api.admin.getPayments(),
      ]);
      setStats(statsRes.data || null);
      setTasks(tasksRes.data || []);
      setSuspiciousTasks(suspiciousRes.data || []);
      setCertificates(certsRes.data || []);
      setPayments(paymentsRes.data || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadAdminData();
  }, [isAdmin, navigate]);

  const tabs: Array<{ id: AdminTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'certificates', label: 'Certificates' },
    { id: 'payments', label: 'Payments / Escrow' },
    { id: 'disputes', label: 'Disputes / Reports' },
  ];

  const overviewCards = useMemo(() => ([
    { label: 'Total Users', value: stats?.totalUsers ?? 0 },
    { label: 'Active Tasks', value: stats?.activeTasks ?? 0 },
    { label: 'Suspicious Tasks', value: stats?.suspiciousTasks ?? 0 },
    { label: 'Escrow-held Payments', value: stats?.escrowHeldPayments ?? 0 },
    { label: 'Pending Certificates', value: stats?.pendingCertificates ?? 0 },
    { label: 'Disputes', value: stats?.disputes ?? 0 },
    { label: 'Escrow Held Amount', value: formatVnd(stats?.totalEscrowHeldAmount ?? 0) },
    { label: 'Platform Revenue (20%)', value: formatVnd(stats?.totalPlatformRevenue ?? 0) },
  ]), [stats]);

  const handleDeleteTask = async (taskId: string | number) => {
    try {
      await api.admin.deleteTask(taskId);
      toast.success('Task soft-deleted');
      loadAdminData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleReviewTask = async (taskId: string | number) => {
    try {
      await api.admin.reviewTask(taskId);
      toast.success('Task marked as reviewed');
      loadAdminData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to review task');
    }
  };

  const handleCertificateAction = async (certificateId: string | number, action: 'verify' | 'reject') => {
    try {
      if (action === 'verify') {
        await api.admin.verifyCertificate(certificateId);
      } else {
        await api.admin.rejectCertificate(certificateId);
      }
      toast.success(`Certificate ${action}d`);
      loadAdminData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update certificate');
    }
  };

  const handleReleasePayment = async (paymentId: string | number) => {
    try {
      await api.admin.releasePayment(paymentId);
      toast.success('Escrow released');
      loadAdminData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to release escrow');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage users, suspicious tasks, certificates, and escrow payments</p>
          </div>
          <Button onClick={loadAdminData} disabled={isLoading}>{isLoading ? 'Refreshing...' : 'Refresh'}</Button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map((item) => (
            <Button key={item.id} variant={tab === item.id ? 'default' : 'outline'} onClick={() => setTab(item.id)}>
              {item.label}
            </Button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {overviewCards.map((card) => (
              <Card key={card.label} className="p-5">
                <p className="text-sm text-gray-600">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
              </Card>
            ))}
          </div>
        )}

        {tab === 'tasks' && (
          <div className="space-y-4">
            <Card className="p-4">
              <p className="font-semibold text-gray-900 mb-2">All Tasks</p>
              <div className="space-y-2 max-h-[300px] overflow-auto">
                {tasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-3">
                    <p className="font-semibold">{task.title}</p>
                    <p className="text-xs text-gray-500">{task.category} • {task.status}</p>
                    <p className="text-xs text-gray-500">Requester: {task.createdBy?.name || '-'}</p>
                  </div>
                ))}
                {tasks.length === 0 && <p className="text-sm text-gray-500">No tasks found.</p>}
              </div>
            </Card>
            <Card className="p-4">
              <p className="font-semibold text-gray-900 mb-2">Suspicious / Flagged Tasks</p>
              {suspiciousTasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-3 mb-2">
                  <p className="font-semibold">{task.title}</p>
                  <p className="text-sm text-red-700">{task.suspiciousReason || 'Flagged as suspicious'}</p>
                  <p className="text-xs text-gray-500 mt-1">Posted by: {task.createdBy?.name || 'Unknown'}</p>
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" onClick={() => handleReviewTask(task.id)}>Mark Reviewed</Button>
                    <Button variant="outline" onClick={() => handleDeleteTask(task.id)}>Soft Delete</Button>
                  </div>
                </div>
              ))}
              {suspiciousTasks.length === 0 && <p className="text-sm text-gray-500">No suspicious tasks.</p>}
            </Card>
          </div>
        )}

        {tab === 'certificates' && (
          <Card className="p-4">
            <p className="font-semibold text-gray-900 mb-3">Provider Certificates</p>
            <div className="space-y-3">
              {certificates.map((cert) => (
                <div key={cert.id} className="border rounded-lg p-3">
                  <p className="font-semibold">{cert.title}</p>
                  <p className="text-sm text-gray-600">{cert.certificateType}</p>
                  <p className="text-xs text-gray-500">Provider: {cert.provider?.name} ({cert.provider?.email})</p>
                  <p className="text-xs text-gray-500">Status: {cert.verificationStatus}</p>
                  <a href={cert.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">Open document</a>
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" onClick={() => handleCertificateAction(cert.id, 'verify')}>Verify</Button>
                    <Button variant="outline" onClick={() => handleCertificateAction(cert.id, 'reject')}>Reject</Button>
                  </div>
                </div>
              ))}
              {certificates.length === 0 && <p className="text-sm text-gray-500">No certificates.</p>}
            </div>
          </Card>
        )}

        {tab === 'payments' && (
          <Card className="p-4">
            <p className="font-semibold text-gray-900 mb-3">Escrow & Payment Transactions</p>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="border rounded-lg p-3">
                  <p className="font-semibold">{payment.task?.title || `Task #${payment.taskId}`}</p>
                  <p className="text-xs text-gray-500">Requester: {payment.payer?.name || '-'}</p>
                  <p className="text-xs text-gray-500">Provider: {payment.provider?.name || '-'}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-sm">
                    <p>Total paid: <span className="font-semibold">{formatVnd(payment.totalAmount || payment.amount || 0)}</span></p>
                    <p>Platform fee (20%): <span className="font-semibold">{formatVnd(payment.platformFeeAmount || 0)}</span></p>
                    <p>Provider payout (80%): <span className="font-semibold">{formatVnd(payment.providerPayoutAmount || 0)}</span></p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Lifecycle: {payment.lifecycleStatus || 'PENDING'}</p>
                  {payment.lifecycleStatus === 'ESCROW_HELD' && (
                    <Button className="mt-2" onClick={() => handleReleasePayment(payment.id)}>Release Escrow</Button>
                  )}
                </div>
              ))}
              {payments.length === 0 && <p className="text-sm text-gray-500">No payments.</p>}
            </div>
          </Card>
        )}

        {tab === 'disputes' && (
          <Card className="p-6">
            <p className="text-sm text-gray-600">Use task detail + dispute management flow to resolve disputes. Live dispute count is shown in Overview.</p>
          </Card>
        )}
      </div>
    </div>
  );
};
