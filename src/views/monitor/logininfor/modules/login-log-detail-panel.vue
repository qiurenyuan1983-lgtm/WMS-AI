<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { fetchExecuteLoginLogAction, fetchGetLoginInforDetail } from '@/service/api/monitor/login-infor';
import { getBrowserIcon, getOsIcon } from '@/utils/icon-tag-format';
import {
  ACCOUNT_TYPE_LABEL,
  FAIL_REASON_LABEL,
  LOGIN_METHOD_LABEL,
  LOGIN_PORT_LABEL,
  LOGIN_STATUS_LABEL,
  LOGIN_STATUS_TAG,
  RISK_LEVEL_COLOR,
  RISK_LEVEL_LABEL
} from '../constants';

const props = defineProps<{ infoId?: CommonType.IdType | null }>();
const emit = defineEmits<{ (e: 'updated'): void; (e: 'close'): void }>();

const loading = ref(false);
const acting = ref(false);
const detail = ref<Api.Monitor.LoginInfor | null>(null);
const actionRemark = ref('');

const riskStyle = computed(() => ({
  color: RISK_LEVEL_COLOR[detail.value?.riskLevel || 'NORMAL']
}));

async function loadDetail() {
  if (!props.infoId) {
    detail.value = null;
    return;
  }
  loading.value = true;
  const { data, error } = await fetchGetLoginInforDetail(props.infoId);
  loading.value = false;
  if (!error && data) detail.value = data;
}

watch(() => props.infoId, loadDetail, { immediate: true });

const canForceLogout = computed(() => detail.value?.onlineFlag || detail.value?.loginStatus === 'ONLINE');
const canLock = computed(() => detail.value && !['LOCKED'].includes(detail.value.loginStatus));
const canUnlock = computed(() => detail.value?.loginStatus === 'LOCKED');
const canMarkNormal = computed(() => detail.value?.abnormalFlag || detail.value?.loginStatus === 'ABNORMAL');

async function runAction(action: Api.Monitor.LoginLogActionType) {
  if (!detail.value) return;
  acting.value = true;
  const { data, error } = await fetchExecuteLoginLogAction({
    infoIds: [detail.value.infoId],
    action,
    remark: actionRemark.value || null
  });
  acting.value = false;
  if (error || !data?.length) return;
  detail.value = data[0];
  actionRemark.value = '';
  window.$message?.success('操作成功');
  emit('updated');
}
</script>

<template>
  <NSpin :show="loading">
    <div v-if="detail">
        <div class="mb-12px flex flex-wrap items-center gap-6px">
          <NTag type="primary" size="small">{{ detail.logNo }}</NTag>
          <NTag :type="LOGIN_STATUS_TAG[detail.loginStatus] || 'default'" size="small">
            {{ LOGIN_STATUS_LABEL[detail.loginStatus] || detail.loginStatus }}
          </NTag>
          <NTag size="small" :style="{ color: riskStyle.color, borderColor: riskStyle.color }">
            {{ RISK_LEVEL_LABEL[detail.riskLevel] || detail.riskLevel }}
          </NTag>
        </div>

        <div class="mb-12px rounded-8px bg-#f8fafc px-12px py-8px text-13px">
          <div class="font-medium" :style="riskStyle">
            {{ RISK_LEVEL_LABEL[detail.riskLevel] }} · 风险评分 {{ detail.riskAnalysis?.score ?? '—' }}
          </div>
          <div class="text-12px text-#6b7280">{{ detail.loginTime }} · {{ detail.ipaddr }}</div>
        </div>

        <NTabs type="line" size="small">
          <NTabPane name="basic" tab="基础信息">
            <NDescriptions bordered :column="1" size="small" label-placement="left" class="mt-8px">
              <NDescriptionsItem label="日志编号">{{ detail.logNo }}</NDescriptionsItem>
              <NDescriptionsItem label="登录状态">
                {{ LOGIN_STATUS_LABEL[detail.loginStatus] || detail.loginStatus }}
              </NDescriptionsItem>
              <NDescriptionsItem label="登录时间">{{ detail.loginTime }}</NDescriptionsItem>
              <NDescriptionsItem label="退出时间">{{ detail.logoutTime || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="在线时长">{{ detail.onlineDuration || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="失败原因">
                {{ detail.failReason ? FAIL_REASON_LABEL[detail.failReason] || detail.failReason : '—' }}
              </NDescriptionsItem>
              <NDescriptionsItem label="系统消息">{{ detail.msg || '—' }}</NDescriptionsItem>
            </NDescriptions>
          </NTabPane>

          <NTabPane name="user" tab="用户信息">
            <NDescriptions bordered :column="1" size="small" label-placement="left" class="mt-8px">
              <NDescriptionsItem label="用户账号">{{ detail.userName }}</NDescriptionsItem>
              <NDescriptionsItem label="用户姓名">{{ detail.nickName || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="账号类型">
                {{ ACCOUNT_TYPE_LABEL[detail.accountType || ''] || detail.accountType || '—' }}
              </NDescriptionsItem>
              <NDescriptionsItem label="所属部门">{{ detail.deptName || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="所属仓库">{{ detail.warehouseName || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="手机号">{{ detail.phone || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="邮箱">{{ detail.email || '—' }}</NDescriptionsItem>
            </NDescriptions>
          </NTabPane>

          <NTabPane name="device" tab="设备信息">
            <NDescriptions bordered :column="1" size="small" label-placement="left" class="mt-8px">
              <NDescriptionsItem label="登录端口">
                {{ LOGIN_PORT_LABEL[detail.loginPort || ''] || detail.loginPort || '—' }}
              </NDescriptionsItem>
              <NDescriptionsItem label="登录方式">
                {{ LOGIN_METHOD_LABEL[detail.loginMethod || ''] || detail.loginMethod || '—' }}
              </NDescriptionsItem>
              <NDescriptionsItem label="设备类型">{{ detail.deviceType || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="浏览器">
                <div class="flex items-center gap-6px">
                  <SvgIcon :icon="getBrowserIcon(detail.browser || '')" />
                  {{ detail.browser || '—' }}
                </div>
              </NDescriptionsItem>
              <NDescriptionsItem label="操作系统">
                <div class="flex items-center gap-6px">
                  <SvgIcon :icon="getOsIcon(detail.os || '')" />
                  {{ detail.os || '—' }}
                </div>
              </NDescriptionsItem>
              <NDescriptionsItem label="设备ID">{{ detail.deviceId || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="设备指纹">{{ detail.deviceFingerprint || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="信任设备">{{ detail.trustedDevice ? '是' : '否' }}</NDescriptionsItem>
            </NDescriptions>
          </NTabPane>

          <NTabPane name="network" tab="网络信息">
            <NDescriptions bordered :column="1" size="small" label-placement="left" class="mt-8px">
              <NDescriptionsItem label="IP地址">{{ detail.ipaddr }}</NDescriptionsItem>
              <NDescriptionsItem label="登录地点">{{ detail.loginLocation || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="运营商">{{ detail.isp || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="代理访问">{{ detail.proxyFlag ? '是' : '否' }}</NDescriptionsItem>
              <NDescriptionsItem label="白名单IP">{{ detail.whitelistIp ? '是' : '否' }}</NDescriptionsItem>
              <NDescriptionsItem label="黑名单IP">{{ detail.blacklistIp ? '是' : '否' }}</NDescriptionsItem>
              <NDescriptionsItem label="客户端标识">{{ detail.clientKey || '—' }}</NDescriptionsItem>
              <NDescriptionsItem label="令牌ID">{{ detail.tokenId || '—' }}</NDescriptionsItem>
            </NDescriptions>
          </NTabPane>

          <NTabPane name="risk" tab="风险分析">
            <div class="mt-8px rounded-8px border border-#e5e7eb p-12px text-13px">
              <div class="mb-8px font-medium" :style="riskStyle">
                {{ RISK_LEVEL_LABEL[detail.riskLevel] }}（{{ detail.riskAnalysis?.score ?? 0 }} 分）
              </div>
              <div class="mb-8px text-#6b7280">风险因素</div>
              <ul class="mb-12px list-disc pl-18px">
                <li v-for="(item, idx) in detail.riskAnalysis?.factors || []" :key="idx">{{ item }}</li>
              </ul>
              <div class="text-#6b7280">处理建议</div>
              <div>{{ detail.riskAnalysis?.suggestion || '—' }}</div>
            </div>
          </NTabPane>

          <NTabPane name="process" tab="处理记录">
            <NTimeline class="mt-10px">
              <NTimelineItem
                v-for="(item, idx) in detail.processRecords || []"
                :key="idx"
                :title="item.action"
                :time="item.time"
              >
                {{ item.operatorName }} · {{ item.remark || '—' }}
              </NTimelineItem>
            </NTimeline>
          </NTabPane>
        </NTabs>

        <div class="mt-14px border-t border-#e5e7eb pt-12px">
          <NInput v-model:value="actionRemark" type="textarea" placeholder="处理备注（可选）" :rows="2" class="mb-10px" />
          <NSpace wrap>
            <NButton v-if="canForceLogout" type="warning" size="small" :loading="acting" @click="runAction('FORCE_LOGOUT')">
              强制退出
            </NButton>
            <NButton v-if="canLock" type="error" size="small" :loading="acting" @click="runAction('LOCK_ACCOUNT')">锁定账号</NButton>
            <NButton v-if="canUnlock" type="primary" size="small" :loading="acting" @click="runAction('UNLOCK_ACCOUNT')">解锁账号</NButton>
            <NButton size="small" :loading="acting" @click="runAction('BLACKLIST_IP')">加入黑名单IP</NButton>
            <NButton size="small" :loading="acting" @click="runAction('WHITELIST_IP')">加入白名单IP</NButton>
            <NButton v-if="canMarkNormal" type="success" size="small" :loading="acting" @click="runAction('MARK_NORMAL')">
              标记正常
            </NButton>
          </NSpace>
        </div>
    </div>
    <NEmpty v-else description="暂无详情数据" />
  </NSpin>
</template>
