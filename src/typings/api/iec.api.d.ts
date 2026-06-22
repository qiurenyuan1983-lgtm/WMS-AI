declare namespace Api {
  namespace Iec {
    type EmployeeStatus = 'WORKING' | 'IDLE' | 'ERROR' | 'PAUSED';
    type FlowStatus = 'ENABLED' | 'DISABLED' | 'DRAFT';
    type TaskStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'WAITING_MANUAL' | 'CANCELLED';
    type TakeoverStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    type CredentialStatus = 'ACTIVE' | 'EXPIRED' | 'DISABLED';
    type LogStatus = 'SUCCESS' | 'FAILED' | 'SKIPPED';

    type IntelligentEmployee = {
      id: number;
      employeeName: string;
      roleType: string;
      roleTypeLabel: string;
      status: EmployeeStatus;
      todayTaskCount: number;
      successRate: number;
      manualTakeoverCount: number;
      avgDurationMinutes: number;
      lastExecuteTime: string | null;
      responsibleModules: string[];
      allowedActions: string[];
      forbiddenActions: string[];
      needManualConfirm: boolean;
      workSchedule: string;
      retryCount: number;
      takeoverOwner: string;
      logLevel: string;
    };

    type AutoFlow = {
      id: number;
      flowName: string;
      triggerType: string;
      triggerTypeLabel: string;
      employeeId: number;
      employeeName: string;
      stepSummary: string;
      status: FlowStatus;
      successRate: number;
      lastExecuteTime: string | null;
    };

    type RpaFlow = {
      id: number;
      flowName: string;
      employeeName: string;
      nodeCount: number;
      status: FlowStatus;
      updatedTime: string;
      nodes: RpaNode[];
    };

    type RpaNodeType =
      | 'READ_ORDER'
      | 'QUERY_INVENTORY'
      | 'CONDITION'
      | 'SEND_EMAIL'
      | 'OPEN_WEB'
      | 'FILL_FORM'
      | 'CLICK_BUTTON'
      | 'GET_RESULT'
      | 'CREATE_TASK'
      | 'MANUAL_CONFIRM';

    type RpaNodeFieldMapping = { source: string; target: string };

    type RpaFailureAction = 'RETRY' | 'MANUAL_TAKEOVER' | 'SKIP' | 'ABORT';

    type RpaNodeConfig = {
      fieldMappings: RpaNodeFieldMapping[];
      conditionField: string;
      conditionOperator: string;
      conditionValue: string;
      onFailure: RpaFailureAction;
      retryTimes: number;
      takeoverOwner: string;
    };

    type RpaNode = {
      id: string;
      type: RpaNodeType;
      label: string;
      x: number;
      y: number;
      config: RpaNodeConfig;
    };

    type ExecutionTask = {
      id: number;
      taskNo: string;
      employeeName: string;
      taskType: string;
      relatedDocNo: string;
      currentStep: string;
      status: TaskStatus;
      startTime: string | null;
      finishTime: string | null;
      failReason: string | null;
      flowName: string;
    };

    type TakeoverTask = {
      id: number;
      takeoverNo: string;
      employeeName: string;
      reasonType: string;
      reasonLabel: string;
      relatedDocNo: string;
      description: string;
      status: TakeoverStatus;
      createTime: string;
      handler: string | null;
    };

    type ExecutionLog = {
      id: number;
      executeTime: string;
      employeeName: string;
      flowName: string;
      stepName: string;
      inputSummary: string;
      outputSummary: string;
      status: LogStatus;
      failReason: string | null;
      operator: string | null;
    };

    type Credential = {
      id: number;
      platformName: string;
      accountType: string;
      username: string;
      passwordMasked: string;
      status: CredentialStatus;
      lastUsedTime: string | null;
      authScope: string;
    };

    type PerformanceStat = {
      employeeId: number;
      employeeName: string;
      taskCount: number;
      successRate: number;
      savedHours: number;
      takeoverRate: number;
      failReasons: Array<{ reason: string; count: number }>;
      trend7d: Array<{ date: string; tasks: number; successRate: number }>;
    };

    type DashboardSummary = {
      totalEmployees: number;
      workingCount: number;
      todayTasks: number;
      avgSuccessRate: number;
      openTakeoverCount: number;
    };
  }
}
