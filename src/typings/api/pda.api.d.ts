declare namespace Api {
  namespace Pda {
    type BusinessKey = 'transfer' | 'transit' | 'dropship';

    type PdaModuleItem = {
      key: string;
      label: string;
      badge: number;
      icon: string;
      route: string;
      query?: Record<string, string>;
    };

    type BusinessGroupSummary = {
      key: BusinessKey;
      label: string;
      desc: string;
      accent: string;
      icon: string;
      pendingTotal: number;
      modules: PdaModuleItem[];
    };

    type PerformanceSummary = {
      dateLabel: string;
      shift: string;
      summary: Array<{ key: string; label: string; value: number; unit: string; color: string }>;
      metrics: Array<{ label: string; value: number }>;
      rank: { position: number; total: number; score: number; trend: string };
    };

    type HomeSummary = {
      displayName: string;
      warehouseName: string;
      notifyCount: number;
      businessGroups: BusinessGroupSummary[];
      performance: PerformanceSummary;
    };

    type InboundPalletInfo = {
      palletLabelNo: string;
      destination: string;
      recommendLocation: string;
      boxCount: number;
      customer: string;
    };

    type InboundConfirmPayload = {
      biz: string;
      palletLabelNo: string;
      locationCode: string;
    };

    type OutboundTripTaskStatus = 'PUSHED' | 'ACCEPTED' | 'LOADING' | 'DONE';

    /** PDA 出库：调度推送给当前作业员的车次任务 */
    type OutboundTripListItem = {
      taskId: string;
      taskNo: string;
      tripNo: string;
      dockNo: string;
      carriageNo: string;
      palletCount: number;
      destination?: string;
      appointmentTime?: string | null;
      latestFinishTime?: string | null;
      deadlineRiskLevel?: string;
      pushedAt: string;
      pushedBy?: string;
      taskStatus: OutboundTripTaskStatus;
    };

    type OutboundLoadPayload = {
      biz: string;
      tripNo: string;
      palletNo: string;
      dockNo?: string;
    };

    type OutboundLoadResult = {
      result: 'success' | 'duplicate' | 'wrong' | 'hold';
      message: string;
      loadedCount: number;
      totalCount: number;
    };

    type OutboundFinishPayload = {
      biz: string;
      tripNo: string;
      photoCount?: number;
    };

    type OutboundSitePhotoPayload = {
      biz: string;
      tripNo?: string;
      containerNo?: string;
      photoCount?: number;
    };

    type OutboundExceptionPayload = {
      biz?: string;
      tripNo?: string;
      containerNo?: string;
      containerAutoRecognized?: boolean;
      orderNo?: string;
      orderUnrecognized?: boolean;
      exceptionType?: DevanningExceptionType;
      remark: string;
      photoCaptured?: boolean;
    };

    type OutboundActionResult = {
      ok: boolean;
      message: string;
    };

    type TaskDetail = {
      taskId: string;
      taskType: string;
      biz: string;
      customer: string;
      palletNo: string;
      currentLocation: string;
      targetLocation: string;
      status: string;
    };

    type TaskActionPayload = {
      action: 'scan' | 'confirm' | 'exception' | 'photo' | 'finish';
      scanCode?: string;
      exceptionReason?: string;
    };

    type TaskActionResult = {
      success: boolean;
      message: string;
      task?: TaskDetail;
    };

    type DevanningTaskStatus = 'PENDING' | 'DEVANNING' | 'PENDING_CONFIRM' | 'COMPLETED';
    type PalletStatus = 'CREATED' | 'BOX_ENTERED' | 'PRINTED' | 'INBOUND' | 'PHOTOED' | 'DONE';
    type ExceptionStatus = 'NORMAL' | 'PENDING' | 'SUPERVISOR_CONFIRM' | 'RESOLVED';

    type DevanningPushInstruction = {
      instructionNo: string;
      taskId: string;
      containerNo: string;
      devanningNo: string;
      dock: string;
      appointmentTime: string;
      pushedAt: string;
      pushedBy: string;
      priority?: 'URGENT' | 'NORMAL' | string;
    };

    type DevanningTaskListItem = {
      id: string;
      containerNo: string;
      devanningNo: string;
      customer: string;
      businessType: string;
      containerType: string;
      dock: string;
      appointmentTime: string;
      destCount: number;
      expectedBoxQty: number;
      expectedPalletQty: number;
      status: DevanningTaskStatus;
      palletCount?: number;
      pendingExceptionCount?: number;
    };

    type DevanningScanResult = {
      ok: boolean;
      message: string;
      taskId?: string;
      task?: DevanningTaskListItem;
    };

    type DevanningDestination = {
      id: string;
      destination: string;
      platform: string;
      locationCode: string;
      palletCount: number;
      boxCount: number;
      exceptionCount: number;
    };

    type DevanningPalletPhoto = {
      type: string;
      label: string;
      required: boolean;
      captured: boolean;
      capturedAt?: string;
    };

    type DevanningPallet = {
      palletNo: string;
      destinationId: string;
      containerNo: string;
      devanningNo: string;
      customer: string;
      businessType: string;
      destination: string;
      platform: string;
      boxQty: number | null;
      sizeL: number;
      sizeW: number;
      sizeH: number;
      skuQty: number;
      mixedPallet: boolean;
      exceptionFlag: boolean;
      exceptionStatus: ExceptionStatus;
      remark: string;
      status: PalletStatus;
      printed: boolean;
      printedAt?: string;
      inboundLocation?: string;
      inboundAt?: string;
      photos: DevanningPalletPhoto[];
      createdAt: string;
      operatorName: string;
    };

    type DevanningTaskDetail = DevanningTaskListItem & {
      destinations: DevanningDestination[];
      pallets: DevanningPallet[];
      startedAt?: string;
      finishedAt?: string;
      operatorName?: string;
    };

    type DevanningCreatePalletPayload = {
      taskId: string;
      destinationId: string;
      boxQty: number;
      sizeL?: number;
      sizeW?: number;
      sizeH?: number;
      skuQty?: number;
      mixedPallet?: boolean;
      exceptionFlag?: boolean;
      remark?: string;
      operatorName?: string;
    };

    type DevanningInboundPayload = {
      taskId: string;
      palletNo: string;
      locationCode: string;
    };

    type DevanningPhotoPayload = {
      taskId: string;
      palletNo: string;
      photoType: string;
    };

    type DevanningSitePhotoPayload = {
      biz: string;
      containerNo?: string;
      taskId?: string;
      photoCount?: number;
    };

    type DevanningExceptionType = 'DAMAGE' | 'WET' | 'UNREPAIRABLE';

    type DevanningExceptionPayload = {
      biz?: string;
      taskId?: string;
      containerNo?: string;
      containerAutoRecognized?: boolean;
      orderNo?: string;
      orderUnrecognized?: boolean;
      exceptionType?: DevanningExceptionType;
      remark: string;
      photoCaptured?: boolean;
    };

    type DevanningFinishPayload = {
      taskId: string;
      reviewMode?: boolean;
      confirmPalletQty?: number;
      confirmBoxQty?: number;
    };

    type DevanningFinishValidation = {
      ok: boolean;
      reasons: string[];
      totalPalletQty?: number;
      totalBoxQty?: number;
      expectedPalletQty?: number;
      expectedBoxQty?: number;
    };

    type DevanningReport = {
      taskId: string;
      containerNo: string;
      devanningNo: string;
      customer: string;
      businessType: string;
      startedAt?: string;
      finishedAt?: string;
      operatorName?: string;
      dock: string;
      status: DevanningTaskStatus;
      totalPalletQty: number;
      totalBoxQty: number;
      destCount: number;
      exceptionCount: number;
      unprintedCount: number;
      uninboundCount: number;
      unphotoCount: number;
      destinationSummary: Array<{
        destination: string;
        platform: string;
        palletCount: number;
        boxCount: number;
        inboundCount: number;
        photoCount: number;
        exceptionCount: number;
      }>;
      palletDetails: Array<{
        palletNo: string;
        destination: string;
        boxQty: number | null;
        size: string;
        status: PalletStatus;
        photoDone: boolean;
        printed: boolean;
        inbound: boolean;
        exceptionStatus: ExceptionStatus;
      }>;
    };

    type DevanningActionResult = {
      ok: boolean;
      message: string;
      reasons?: string[];
      task?: DevanningTaskDetail;
      palletNo?: string;
      pallet?: DevanningPallet;
      report?: DevanningReport;
    };
  }
}
