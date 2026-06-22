/**
 * Namespace Api
 *
 * All backend api type
 */
declare namespace Api {
  /**
   * namespace Monitor
   *
   * backend api module: "monitor"
   */
  namespace Monitor {
    /** 业务操作类型 */
    type BusinessType = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

    type OperLogCategory =
      | 'CREATE'
      | 'UPDATE'
      | 'DELETE'
      | 'APPROVE'
      | 'IMPORT_EXPORT'
      | 'PRINT'
      | 'DISPATCH'
      | 'INVENTORY'
      | 'PERMISSION'
      | 'FEE'
      | 'ABNORMAL';

    type OperLogCategoryTab =
      | 'ALL'
      | 'CREATE'
      | 'UPDATE'
      | 'DELETE'
      | 'APPROVE'
      | 'IMPORT_EXPORT'
      | 'PRINT'
      | 'DISPATCH'
      | 'INVENTORY'
      | 'PERMISSION'
      | 'FEE'
      | 'ABNORMAL';

    type OperLogResult = 'SUCCESS' | 'FAILED';

    type OperLogFailReason =
      | 'PERMISSION_DENIED'
      | 'PARAM_ERROR'
      | 'SYSTEM_ERROR'
      | 'STATUS_NOT_ALLOWED'
      | 'INVENTORY_NOT_ENOUGH';

    type OperLogChangeField = {
      field: string;
      beforeValue: string;
      afterValue: string;
    };

    type OperLogRelatedLog = {
      logNo: string;
      operTime: string;
      operType: string;
      summary: string;
    };

    type OperLogRiskAnalysis = {
      level: LoginRiskLevel;
      score: number;
      factors: string[];
      suggestion?: string | null;
      highRisk?: boolean;
    };

    /** oper log */
    type OperLog = Common.CommonRecord<{
      operId: CommonType.IdType;
      tenantId?: CommonType.IdType;
      logNo: string;
      operTime: string;
      operName: string;
      operNickName?: string | null;
      deptName?: string | null;
      warehouseName?: string | null;
      title: string;
      operModule?: string | null;
      operPage?: string | null;
      businessType?: BusinessType | string | null;
      operCategory?: OperLogCategory | string | null;
      operType?: string | null;
      operObject?: string | null;
      bizNo?: string | null;
      operContent?: string | null;
      operResult?: OperLogResult | string | null;
      riskLevel?: LoginRiskLevel | string | null;
      highRiskFlag?: boolean;
      confirmRemark?: string | null;
      method?: string | null;
      requestMethod?: string | null;
      operatorType?: string | null;
      operUrl?: string | null;
      operIp: string;
      operLocation?: string | null;
      deviceType?: string | null;
      operParam?: string | null;
      jsonResult?: string | null;
      status?: Common.EnableStatus | string | null;
      errorMsg?: string | null;
      failReason?: OperLogFailReason | string | null;
      costTime: number;
      changeFields?: OperLogChangeField[];
      riskAnalysis?: OperLogRiskAnalysis | null;
      relatedLogs?: OperLogRelatedLog[];
      userAgent?: string | null;
    }>;

    type OperLogStats = {
      todayTotal: number;
      successCount: number;
      failedCount: number;
      highRiskCount: number;
      dataChangeCount: number;
      exportCount: number;
      approveCount: number;
      abnormalCount: number;
      tabCounts?: Partial<Record<OperLogCategoryTab, number>>;
    };

    /** oper log search params */
    type OperLogSearchParams = CommonType.RecordNullable<{
      operName?: string | null;
      operNickName?: string | null;
      deptName?: string | null;
      warehouseName?: string | null;
      title?: string | null;
      operModule?: string | null;
      operPage?: string | null;
      operCategory?: OperLogCategory | string | null;
      operType?: string | null;
      operObject?: string | null;
      bizNo?: string | null;
      operResult?: OperLogResult | string | null;
      riskLevel?: LoginRiskLevel | string | null;
      operIp?: string | null;
      deviceType?: string | null;
      tabKey?: OperLogCategoryTab | string | null;
      businessType?: BusinessType | string | null;
      status?: Common.EnableStatus | string | null;
      operTime?: string | null;
      params?: {
        beginTime?: string | null;
        endTime?: string | null;
      };
    } & Api.Common.CommonSearchParams>;

    /** oper log list */
    type OperLogList = Api.Common.PaginatingQueryRecord<OperLog>;

    type LoginLogStatus =
      | 'SUCCESS'
      | 'FAILED'
      | 'ABNORMAL'
      | 'LOCKED'
      | 'LOGGED_OUT'
      | 'ONLINE'
      | 'FORCE_LOGOUT';

    type LoginFailReason =
      | 'PASSWORD_ERROR'
      | 'CAPTCHA_ERROR'
      | 'USER_NOT_FOUND'
      | 'USER_DISABLED'
      | 'ACCOUNT_LOCKED'
      | 'IP_RESTRICTED'
      | 'DEVICE_RESTRICTED'
      | 'PERMISSION_DENIED'
      | 'SYSTEM_ERROR';

    type LoginRiskLevel = 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH';

    type LoginAccountType = 'SYSTEM' | 'WMS' | 'OMS' | 'TMS' | 'DRIVER' | 'SUPPLIER' | 'CUSTOMER';

    type LoginPort = 'PC' | 'PDA' | 'MOBILE' | 'API';

    type LoginMethod = 'PASSWORD' | 'SMS' | 'SSO' | 'SCAN' | 'TOKEN';

    type LoginLogTab =
      | 'ALL'
      | 'SUCCESS'
      | 'FAILED'
      | 'ABNORMAL'
      | 'LOCKED'
      | 'ONLINE'
      | 'LOGGED_OUT';

    type LoginLogProcessRecord = {
      time: string;
      operatorName: string;
      action: string;
      remark?: string | null;
    };

    type LoginLogRiskAnalysis = {
      level: LoginRiskLevel;
      score: number;
      factors: string[];
      suggestion?: string | null;
    };

    /** login infor */
    type LoginInfor = Common.CommonRecord<{
      infoId: CommonType.IdType;
      tenantId?: CommonType.IdType;
      logNo: string;
      userName: string;
      nickName?: string | null;
      accountType?: LoginAccountType | string | null;
      deptName?: string | null;
      warehouseName?: string | null;
      clientKey?: string | null;
      deviceType?: System.DeviceType | string | null;
      loginPort?: LoginPort | string | null;
      loginMethod?: LoginMethod | string | null;
      ipaddr: string;
      loginLocation?: string | null;
      browser?: string | null;
      os?: string | null;
      loginTime: string;
      logoutTime?: string | null;
      onlineDuration?: string | null;
      loginStatus: LoginLogStatus | string;
      failReason?: LoginFailReason | string | null;
      riskLevel: LoginRiskLevel | string;
      abnormalFlag?: boolean;
      onlineFlag?: boolean;
      tokenId?: string | null;
      msg?: string | null;
      /** 兼容旧字典字段 */
      status?: Common.EnableStatus | string | null;
      phone?: string | null;
      email?: string | null;
      deviceId?: string | null;
      deviceFingerprint?: string | null;
      trustedDevice?: boolean;
      isp?: string | null;
      proxyFlag?: boolean;
      whitelistIp?: boolean;
      blacklistIp?: boolean;
      riskAnalysis?: LoginLogRiskAnalysis | null;
      processRecords?: LoginLogProcessRecord[];
    }>;

    type LoginLogStats = {
      todayLogin: number;
      success: number;
      failed: number;
      abnormal: number;
      locked: number;
      onlineUsers: number;
      tabCounts?: Partial<Record<LoginLogTab, number>>;
    };

    /** login infor search params */
    type LoginInforSearchParams = CommonType.RecordNullable<{
      userName?: string | null;
      nickName?: string | null;
      accountType?: LoginAccountType | string | null;
      deptName?: string | null;
      warehouseName?: string | null;
      loginStatus?: LoginLogStatus | string | null;
      loginMethod?: LoginMethod | string | null;
      loginPort?: LoginPort | string | null;
      ipaddr?: string | null;
      deviceType?: string | null;
      riskLevel?: LoginRiskLevel | string | null;
      tabKey?: LoginLogTab | string | null;
      status?: Common.EnableStatus | string | null;
      params?: {
        beginTime?: string | null;
        endTime?: string | null;
      };
    } & Api.Common.CommonSearchParams>;

    type LoginLogActionType =
      | 'FORCE_LOGOUT'
      | 'LOCK_ACCOUNT'
      | 'UNLOCK_ACCOUNT'
      | 'BLACKLIST_IP'
      | 'WHITELIST_IP'
      | 'MARK_NORMAL';

    type LoginLogActionParams = {
      infoIds: CommonType.IdType[];
      action: LoginLogActionType;
      remark?: string | null;
    };

    /** login infor list */
    type LoginInforList = Api.Common.PaginatingQueryRecord<LoginInfor>;

    type RedisRiskLevel = 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH';

    type RedisInstanceStatus = 'RUNNING' | 'WARNING' | 'OFFLINE';

    type RedisCacheOverview = {
      redisStatus: RedisInstanceStatus | string;
      redisStatusLabel: string;
      memoryUsagePercent: number;
      memoryUsedHuman: string;
      memoryMaxHuman: string;
      hitRate: number;
      connections: number;
      qps: number;
      keyCount: number;
      slowQueryCount: number;
      uptimeDays: number;
      uptimeLabel: string;
      evictedKeys?: number;
    };

    type RedisInstance = Common.CommonRecord<{
      id: CommonType.IdType;
      instanceName: string;
      env: string;
      host: string;
      port: number;
      mode: string;
      role: string;
      status: RedisInstanceStatus | string;
      memoryUsedHuman: string;
      memoryUsagePercent: number;
      hitRate: number;
      connections: number;
      qps: number;
      lastCheckTime: string;
      redisVersion?: string;
      maxMemoryHuman?: string;
      aofEnabled?: boolean;
      rdbStatus?: string;
    }>;

    type RedisTrendPoint = {
      time: string;
      memoryPercent: number;
      hitRate: number;
      connections: number;
      qps: number;
    };

    type RedisKeyCategory = {
      prefix: string;
      businessModule: string;
      keyCount: number;
      memoryHuman: string;
      avgTtlSeconds: number;
    };

    type RedisBigKey = {
      id: CommonType.IdType;
      keyName: string;
      keyType: string;
      memoryHuman: string;
      elementCount: number;
      ttlSeconds: number;
      businessModule: string;
      riskLevel: RedisRiskLevel | string;
      instanceName: string;
    };

    type RedisHotKey = {
      id: CommonType.IdType;
      keyName: string;
      accessCount: number;
      qps: number;
      businessModule: string;
      riskLevel: RedisRiskLevel | string;
      instanceName: string;
    };

    type RedisKeyExpiryStats = {
      neverExpireCount: number;
      expiringSoonCount: number;
      expiringSoonKeys: Array<{ keyName: string; ttlSeconds: number; businessModule: string }>;
    };

    type RedisSlowQuery = {
      id: CommonType.IdType;
      queryId: string;
      executeTime: string;
      durationMs: number;
      command: string;
      keyName: string;
      clientIp: string;
      sourceService: string;
      riskLevel: RedisRiskLevel | string;
      suggestion: string;
      instanceName: string;
    };

    type RedisAlertStatus = 'PENDING' | 'ACKED' | 'RESOLVED' | 'IGNORED';

    type RedisAlert = {
      id: CommonType.IdType;
      alertNo: string;
      alertType: string;
      instanceName: string;
      content: string;
      riskLevel: RedisRiskLevel | string;
      triggerTime: string;
      currentValue: string;
      threshold: string;
      status: RedisAlertStatus | string;
    };

    type RedisOpsLog = {
      id: CommonType.IdType;
      operateTime: string;
      operatorName: string;
      operateType: string;
      operateTarget: string;
      beforeValue?: string | null;
      afterValue?: string | null;
      result: string;
      ipaddr: string;
      riskLevel: RedisRiskLevel | string;
    };

    type RedisCacheDashboard = {
      overview: RedisCacheOverview;
      instances: RedisInstance[];
      trends: RedisTrendPoint[];
      commandStats: { name: string; value: number }[];
    };

    type RedisCacheActionType =
      | 'REFRESH'
      | 'SET_TTL'
      | 'CLEAR_PREFIX'
      | 'CLEAR_SLOW_LOG'
      | 'EXPORT_REPORT'
      | 'SET_ALERT_RULE'
      | 'FLUSHDB'
      | 'FLUSHALL'
      | 'RESTART'
      | 'SET_MAXMEMORY';

    type RedisCacheActionParams = {
      action: RedisCacheActionType;
      instanceId?: CommonType.IdType | null;
      target?: string | null;
      ttlSeconds?: number | null;
      remark?: string | null;
    };

    /** cache info (legacy) */
    type CacheInfo = Common.CommonRecord<{
      info: {
        redis_version: string;
        redis_mode: string;
        tcp_port: number;
        connected_clients: number;
        uptime_in_days: number;
        used_memory_human: string;
        used_cpu_user_children: string;
        maxmemory_human: string | number;
        aof_enabled: string;
        rdb_last_bgsave_status: string;
        dbSize?: number;
        instantaneous_input_kbps: number;
        instantaneous_output_kbps: number;
      };
      dbSize: number;
      commandStats: { name: string; value: number }[];
    }>;

    type OnlineSessionStatus = 'ONLINE' | 'IDLE' | 'EXPIRING' | 'ABNORMAL' | 'FORCE_LOGOUT' | 'EXPIRED';

    type OnlineSessionTab = 'ALL' | 'PC' | 'PDA' | 'CUSTOMER' | 'SUPPLIER' | 'DRIVER' | 'IDLE' | 'ABNORMAL';

    type OnlineSessionTrack = {
      time: string;
      page: string;
      action: string;
    };

    type OnlineManageRecord = {
      time: string;
      operatorName: string;
      action: string;
      remark?: string | null;
    };

    type OnlineSessionRiskAnalysis = {
      level: LoginRiskLevel;
      score: number;
      factors: string[];
      suggestion?: string | null;
    };

    type OnlineUser = Common.CommonRecord<{
      sessionId: string;
      tokenId: string;
      userName: string;
      nickName?: string | null;
      accountType?: LoginAccountType | string | null;
      roleName?: string | null;
      deptName?: string | null;
      warehouseName?: string | null;
      loginPort?: LoginPort | string | null;
      currentPage?: string | null;
      ipaddr: string;
      loginLocation?: string | null;
      deviceType?: System.DeviceType | string | null;
      browser?: string | null;
      os?: string | null;
      loginTime: string;
      lastActiveTime?: string | null;
      onlineDuration?: string | null;
      idleDuration?: string | null;
      onlineStatus: OnlineSessionStatus | string;
      riskLevel: LoginRiskLevel | string;
      abnormalFlag?: boolean;
      phone?: string | null;
      email?: string | null;
      deviceId?: string | null;
      trustedDevice?: boolean;
      isp?: string | null;
      whitelistIp?: boolean;
      blacklistIp?: boolean;
      operationTracks?: OnlineSessionTrack[];
      riskAnalysis?: OnlineSessionRiskAnalysis | null;
      manageRecords?: OnlineManageRecord[];
    }>;

    type OnlineSessionStats = {
      totalOnline: number;
      pcOnline: number;
      pdaOnline: number;
      customerOnline: number;
      supplierOnline: number;
      driverOnline: number;
      abnormalSessions: number;
      forceLogoutToday: number;
      tabCounts?: Partial<Record<OnlineSessionTab, number>>;
    };

    /** online user list */
    type OnlineUserList = Api.Common.PaginatingQueryRecord<OnlineUser>;

    /** online user search params */
    type OnlineUserSearchParams = CommonType.RecordNullable<{
      userName?: string | null;
      nickName?: string | null;
      accountType?: LoginAccountType | string | null;
      deptName?: string | null;
      warehouseName?: string | null;
      loginPort?: LoginPort | string | null;
      onlineStatus?: OnlineSessionStatus | string | null;
      ipaddr?: string | null;
      deviceType?: string | null;
      riskLevel?: LoginRiskLevel | string | null;
      tabKey?: OnlineSessionTab | string | null;
      params?: {
        beginLoginTime?: string | null;
        endLoginTime?: string | null;
        beginActiveTime?: string | null;
        endActiveTime?: string | null;
      };
    } & Api.Common.CommonSearchParams>;

    type OnlineSessionActionType =
      | 'FORCE_LOGOUT'
      | 'LOCK_ACCOUNT'
      | 'MARK_NORMAL'
      | 'BLACKLIST_IP'
      | 'WHITELIST_IP'
      | 'NOTIFY_USER';

    type OnlineSessionActionParams = {
      tokenIds: string[];
      action: OnlineSessionActionType;
      remark?: string | null;
    };
  }
}
