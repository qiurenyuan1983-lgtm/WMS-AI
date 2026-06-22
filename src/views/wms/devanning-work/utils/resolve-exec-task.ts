const EXEC_TASK_STATUS_PRIORITY = ['DEVANNING', 'ARRIVED', 'PICKEDUP', 'UNPICKEDUP', 'EXCEPTION'] as const;

/** 为 Dock 入口挑选应进入拆柜操作的任务（优先拆柜中） */
export function pickDevanningExecTask(
  tasks: Api.Wms.DevanningWorkTask[],
  dockId?: string | number | null
) {
  const pool = dockId != null && dockId !== ''
    ? tasks.filter(task => String(task.dockId) === String(dockId))
    : tasks;

  for (const status of EXEC_TASK_STATUS_PRIORITY) {
    const matched = pool.find(task => task.devanningStatus === status);
    if (matched) return matched;
  }

  return (
    pool.find(task => !['CANCELLED', 'DEVANNED'].includes(task.devanningStatus)) ??
    pool[0] ??
    null
  );
}

export function buildDevanningExecQuery(task: Api.Wms.DevanningWorkTask) {
  return {
    dockId: String(task.dockId || '3010001'),
    taskId: String(task.id),
    containerNo: task.containerNo
  };
}
