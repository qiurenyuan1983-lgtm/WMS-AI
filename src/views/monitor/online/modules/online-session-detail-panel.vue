<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { fetchExecuteOnlineSessionAction, fetchGetOnlineSessionDetail } from '@/service/api/monitor/online';
import { getBrowserIcon, getOsIcon } from '@/utils/icon-tag-format';
import {
  ACCOUNT_TYPE_LABEL,
  LOGIN_PORT_LABEL,
  ONLINE_STATUS_LABEL,
  ONLINE_STATUS_TAG,
  RISK_LEVEL_COLOR,
  RISK_LEVEL_LABEL
} from '../constants';

const props = defineProps<{ tokenId?: string | null }>();
const emit = defineEmits<{ (e: 'updated'): void; (e: 'close'): void }>();

const router = useRouter();
const loading = ref(false);
const acting = ref(false);
const detail = ref<Api.Monitor.OnlineUser | null>(null);
const actionRemark = ref('');

const riskStyle = computed(() => ({
  color: RISK_LEVEL_COLOR[detail.value?.riskLevel || 'NORMAL']
}));

async function loadDetail() {
  if (!props.tokenId) {
    detail.value = null;
    return;
  }
  loading.value = true;
  const { data, error } = await fetchGetOnlineSessionDetail(props.tokenId);
  loading.value = false;
  if (!error && data) detail.value = data;
}

watch(() => props.tokenId, loadDetail, { immediate: true });

async function runAction(action: Api.Monitor.OnlineSessionActionType) {
  if (!detail.value) return;
  acting.value = true;
  const { data, error } = await fetchExecuteOnlineSessionAction({
    tokenIds: [detail.value.tokenId],
    action,
    remark: actionRemark.value || null
  });
  acting.value = false;
  if (error) return;
  if (action === 'FORCE_LOGOUT' || action === 'LOCK_ACCOUNT') {
    window.$message?.success(action === 'LOCK_ACCOUNT' ? '已锁定并强制下线' : '强制下线成功');
    emit('updated');
    emit('close');
    return;
  }
  if (data?.length) detail.value = data[0];
  actionRemark.value = '';
  window.$message?.success('操作成功');
  emit('updated');
}

function goLoginLog() {
  router.push({ name: 'monitor_logininfor', query: { userName: detail.value?.userName } });
}
</script>

<template>
  <NSpin :show="loading">
    <div v-if="detail">
      <div class="mb-12px flex flex-wrap items-center gap-6px">
        <NTag type="primary" size="small">{{ detail.sessionId }}</NTag>
        <NTag :type="ONLINE_STATUS_TAG[detail.onlineStatus] || 'default'" size="small">
          {{ ONLINE_STATUS_LABEL[detail.onlineStatus] || detail.onlineStatus }}
        </NTag>
        <NTag size="small" :style="{ color: riskStyle.color, borderColor: riskStyle.color }">
          {{ RISK_LEVEL_LABEL[detail.riskLevel] || detail.riskLevel }}
        </NTag>
      </div>

      <div class="mb-12px rounded-8px bg-#f8fafc px-12px py-8px text-13px">
        <div class="font-medium" :style="riskStyle">
          {{ detail.currentPage }} · 在线 {{ detail.onlineDuration }}
        </div>
        <div class="text-12px text-#6b7280">最后活跃：{{ detail.lastActiveTime }} · 空闲 {{ detail.idleDuration }}</div>
      </div>

      <NTabs type="line" size="small">
        <NTabPane name="basic" tab="基础信息">
          <NDescriptions bordered :column="1" size="small" label-placement="left" class="mt-8px">
            <NDescriptionsItem label="会话ID">{{ detail.sessionId }}</NDescriptionsItem>
            <NDescriptionsItem label="在线状态">{{ ONLINE_STATUS_LABEL[detail.onlineStatus] }}</NDescriptionsItem>
            <NDescriptionsItem label="当前页面">{{ detail.currentPage }}</NDescriptionsItem>
            <NDescriptionsItem label="登录时间">{{ detail.loginTime }}</NDescriptionsItem>
            <NDescriptionsItem label="在线时长">{{ detail.onlineDuration }}</NDescriptionsItem>
            <NDescriptionsItem label="空闲时长">{{ detail.idleDuration }}</NDescriptionsItem>
          </NDescriptions>
        </NTabPane>

        <NTabPane name="user" tab="用户信息">
          <NDescriptions bordered :column="1" size="small" label-placement="left" class="mt-8px">
            <NDescriptionsItem label="用户账号">{{ detail.userName }}</NDescriptionsItem>
            <NDescriptionsItem label="用户姓名">{{ detail.nickName }}</NDescriptionsItem>
            <NDescriptionsItem label="账号类型">{{ ACCOUNT_TYPE_LABEL[detail.accountType || ''] || detail.accountType }}</NDescriptionsItem>
            <NDescriptionsItem label="角色">{{ detail.roleName }}</NDescriptionsItem>
            <NDescriptionsItem label="所属部门">{{ detail.deptName }}</NDescriptionsItem>
            <NDescriptionsItem label="所属仓库">{{ detail.warehouseName }}</NDescriptionsItem>
          </NDescriptions>
        </NTabPane>

        <NTabPane name="session" tab="会话信息">
          <NDescriptions bordered :column="1" size="small" label-placement="left" class="mt-8px">
            <NDescriptionsItem label="令牌ID">{{ detail.tokenId }}</NDescriptionsItem>
            <NDescriptionsItem label="登录端口">{{ LOGIN_PORT_LABEL[detail.loginPort || ''] || detail.loginPort }}</NDescriptionsItem>
            <NDescriptionsItem label="最后活跃">{{ detail.lastActiveTime }}</NDescriptionsItem>
            <NDescriptionsItem label="PDA单设备">PDA账号仅允许单设备在线</NDescriptionsItem>
            <NDescriptionsItem label="司机端限制">司机账号仅允许司机端在线</NDescriptionsItem>
          </NDescriptions>
        </NTabPane>

        <NTabPane name="device" tab="设备信息">
          <NDescriptions bordered :column="1" size="small" label-placement="left" class="mt-8px">
            <NDescriptionsItem label="设备类型">{{ detail.deviceType }}</NDescriptionsItem>
            <NDescriptionsItem label="浏览器">
              <div class="flex items-center gap-6px">
                <SvgIcon :icon="getBrowserIcon(detail.browser || '')" />
                {{ detail.browser }}
              </div>
            </NDescriptionsItem>
            <NDescriptionsItem label="操作系统">
              <div class="flex items-center gap-6px">
                <SvgIcon :icon="getOsIcon(detail.os || '')" />
                {{ detail.os }}
              </div>
            </NDescriptionsItem>
            <NDescriptionsItem label="设备ID">{{ detail.deviceId }}</NDescriptionsItem>
            <NDescriptionsItem label="信任设备">{{ detail.trustedDevice ? '是' : '否' }}</NDescriptionsItem>
          </NDescriptions>
        </NTabPane>

        <NTabPane name="network" tab="网络信息">
          <NDescriptions bordered :column="1" size="small" label-placement="left" class="mt-8px">
            <NDescriptionsItem label="IP地址">{{ detail.ipaddr }}</NDescriptionsItem>
            <NDescriptionsItem label="登录地点">{{ detail.loginLocation }}</NDescriptionsItem>
            <NDescriptionsItem label="运营商">{{ detail.isp }}</NDescriptionsItem>
            <NDescriptionsItem label="白名单IP">{{ detail.whitelistIp ? '是' : '否' }}</NDescriptionsItem>
            <NDescriptionsItem label="黑名单IP">{{ detail.blacklistIp ? '是' : '否' }}</NDescriptionsItem>
          </NDescriptions>
        </NTabPane>

        <NTabPane name="track" tab="操作轨迹">
          <NTimeline class="mt-10px">
            <NTimelineItem v-for="(item, idx) in detail.operationTracks || []" :key="idx" :title="item.action" :time="item.time">
              {{ item.page }}
            </NTimelineItem>
          </NTimeline>
        </NTabPane>

        <NTabPane name="risk" tab="风险分析">
          <div class="mt-8px rounded-8px border border-#e5e7eb p-12px text-13px">
            <div class="mb-8px font-medium" :style="riskStyle">
              {{ RISK_LEVEL_LABEL[detail.riskLevel] }}（{{ detail.riskAnalysis?.score ?? 0 }} 分）
            </div>
            <ul class="mb-12px list-disc pl-18px">
              <li v-for="(f, idx) in detail.riskAnalysis?.factors || []" :key="idx">{{ f }}</li>
            </ul>
            <div>{{ detail.riskAnalysis?.suggestion }}</div>
          </div>
        </NTabPane>

        <NTabPane name="manage" tab="管理操作记录">
          <NTimeline class="mt-10px">
            <NTimelineItem
              v-for="(item, idx) in detail.manageRecords || []"
              :key="idx"
              :title="item.action"
              :time="item.time"
            >
              {{ item.operatorName }} · {{ item.remark || '—' }}
            </NTimelineItem>
            <NEmpty v-if="!(detail.manageRecords || []).length" description="暂无管理操作记录" />
          </NTimeline>
        </NTabPane>
      </NTabs>

      <div class="mt-14px border-t border-#e5e7eb pt-12px">
        <NInput v-model:value="actionRemark" type="textarea" placeholder="操作原因（强制下线/锁定时必填）" :rows="2" class="mb-10px" />
        <NSpace wrap>
          <NButton type="warning" size="small" :loading="acting" @click="runAction('FORCE_LOGOUT')">强制下线</NButton>
          <NButton type="error" size="small" :loading="acting" @click="runAction('LOCK_ACCOUNT')">锁定账号</NButton>
          <NButton v-if="detail.abnormalFlag" type="success" size="small" :loading="acting" @click="runAction('MARK_NORMAL')">标记正常</NButton>
          <NButton size="small" :loading="acting" @click="runAction('BLACKLIST_IP')">加入黑名单IP</NButton>
          <NButton size="small" :loading="acting" @click="runAction('WHITELIST_IP')">加入白名单IP</NButton>
          <NButton size="small" :loading="acting" @click="runAction('NOTIFY_USER')">通知用户</NButton>
          <NButton size="small" @click="goLoginLog">查看登录日志</NButton>
        </NSpace>
      </div>
    </div>
    <NEmpty v-else description="暂无会话数据" />
  </NSpin>
</template>
