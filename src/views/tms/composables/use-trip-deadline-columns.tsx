import { NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import TripDeadlineCountdown from '@/components/tms/TripDeadlineCountdown.vue';
import TripDeadlineRiskTag from '@/components/tms/TripDeadlineRiskTag.vue';
import { formatRemainingMinutes, type TripDeadlineRiskLevel } from '@/utils/tms/trip-deadline';

export type TripDeadlineRow = {
  appointmentTime?: string | null;
  distanceMiles?: number;
  estimatedTravelMinutes?: number;
  latestStartLoadingTime?: string | null;
  latestFinishTime?: string | null;
  remainingMinutes?: number | null;
  deadlineRiskLevel?: TripDeadlineRiskLevel | string | null;
  originWarehouse?: string | null;
  destination?: string | null;
  palletQty?: number;
  cartonQty?: number;
  loadingMethod?: string | null;
};

export function useTripDeadlineColumns<T extends TripDeadlineRow>(options?: { showCountdown?: boolean }) {
  const showCountdown = options?.showCountdown ?? true;

  const cols: DataTableColumns<T> = [
    {
      key: 'appointmentTime',
      title: '预约时间',
      width: 148,
      render: row => row.appointmentTime || '—'
    },
    {
      key: 'distanceMiles',
      title: '距离',
      width: 72,
      align: 'center',
      render: row => (row.distanceMiles != null ? `${row.distanceMiles} mi` : '—')
    },
    {
      key: 'estimatedTravelMinutes',
      title: '预计行驶',
      width: 88,
      align: 'center',
      render: row => (row.estimatedTravelMinutes != null ? `${row.estimatedTravelMinutes} 分` : '—')
    },
    {
      key: 'latestStartLoadingTime',
      title: '最晚开始装车',
      width: 158,
      render: row => row.latestStartLoadingTime || '—'
    },
    {
      key: 'latestFinishTime',
      title: '最晚完成',
      width: 158,
      render: row => row.latestFinishTime || '—'
    },
    {
      key: 'remainingMinutes',
      title: '剩余时间',
      width: showCountdown ? 148 : 108,
      render: row =>
        showCountdown ? (
          <TripDeadlineCountdown
            appointmentTime={row.appointmentTime}
            originWarehouse={row.originWarehouse}
            destination={row.destination}
            palletQty={row.palletQty}
            cartonQty={row.cartonQty}
            loadingMethod={row.loadingMethod}
            latestFinishTime={row.latestFinishTime}
            remainingMinutes={row.remainingMinutes}
            deadlineRiskLevel={row.deadlineRiskLevel}
            compact
          />
        ) : (
          formatRemainingMinutes(row.remainingMinutes ?? null)
        )
    },
    {
      key: 'deadlineRiskLevel',
      title: '风险等级',
      width: 88,
      align: 'center',
      render: row => <TripDeadlineRiskTag level={row.deadlineRiskLevel} size="small" />
    }
  ];

  return cols;
}

export function renderDeadlinePriorityTag(score?: number) {
  if (score == null) return null;
  const type = score >= 90 ? 'error' : score >= 70 ? 'warning' : 'success';
  return (
    <NTag size="small" type={type}>
      优先级 {score}
    </NTag>
  );
}
