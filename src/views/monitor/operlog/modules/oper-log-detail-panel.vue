<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { fetchGetOperLogDetail } from '@/service/api/monitor/oper-log';
import { getRequestMethodTagType } from '@/utils/icon-tag-format';
import {
  FAIL_REASON_LABEL,
  OPER_RESULT_LABEL,
  OPER_RESULT_TAG,
  RISK_LEVEL_COLOR,
  RISK_LEVEL_LABEL
} from '../constants';

const props = defineProps<{ operId?: CommonType.IdType | null }>();
const emit = defineEmits<{ (e: 'close'): void }>();

const loading = ref(false);
const detail = ref<Api.Monitor.OperLog | null>(null);

const riskStyle = computed(() => ({
  color: RISK_LEVEL_COLOR[detail.value?.riskLevel || 'NORMAL']
}));

const changeColumns = [
  { key: 'field', title: '字段', width: 140 },
  { key: 'beforeValue', title: '操作前', ellipsis: { tooltip: true } },
  { key: 'afterValue', title: '操作后', ellipsis: { tooltip: true } }
];

async function loadDetail() {
  if (!props.operId) {
    detail.value = null;
    return;
  }
  loading.value = true;
  const { data, error } = await fetchGetOperLogDetail(props.operId);
  loading.value = false;
  if (!error && data) detail.value = data;
}

watch(() => props.operId, loadDetail, { immediate: true });
</script>

<template>
  <NSpin :show="loading">
    <div v-if="detail">
      <div class="mb-12px flex flex-wrap items-center gap-6px">
        <NTag type="primary" size="small">{{ detail.logNo }}</NTag>
        <NTag :type="OPER_RESULT_TAG[detail.operResult || ''] || 'default'" size="small">
          {{ OPER_RESULT_LABEL[detail.operResult || ''] || detail.operResult }}
        </NTag>
        <NTag size="small" :style="{ color: riskStyle.color, borderColor: riskStyle.color }">
          {{ RISK_LEVEL_LABEL[detail.riskLevel || ''] || detail.riskLevel }}
        </NTag>
        <NTag v-if="detail.highRiskFlag" type="error" size="small">高风险</NTag>
      </div>

      <NTabs type="line" size="small">
        <NTabPane name="basic" tab="基础信息">
          <NDescriptions bordered :column="1" size="small" label-placement="left" class="mt-8px">
            <NDescriptionsItem label="日志编号">{{ detail.logNo }}</NDescriptionsItem>
            <NDescriptionsItem label="操作时间">{{ detail.operTime }}</NDescriptionsItem>
            <NDescriptionsItem label="操作模块">{{ detail.operModule }}</NDescriptionsItem>
            <NDescriptionsItem label="操作页面">{{ detail.operPage }}</NDescriptionsItem>
            <NDescriptionsItem label="操作类型">{{ detail.operType }}</NDescriptionsItem>
            <NDescriptionsItem label="操作内容">{{ detail.operContent }}</NDescriptionsItem>
            <NDescriptionsItem label="操作结果">{{ OPER_RESULT_LABEL[detail.operResult || ''] || detail.operResult }}</NDescriptionsItem>
            <NDescriptionsItem label="操作耗时">{{ detail.costTime }} ms</NDescriptionsItem>
            <NDescriptionsItem v-if="detail.confirmRemark" label="确认原因">{{ detail.confirmRemark }}</NDescriptionsItem>
            <NDescriptionsItem v-if="detail.failReason" label="失败原因">
              {{ FAIL_REASON_LABEL[detail.failReason] || detail.failReason }}
            </NDescriptionsItem>
            <NDescriptionsItem v-if="detail.errorMsg" label="错误消息">{{ detail.errorMsg }}</NDescriptionsItem>
          </NDescriptions>
        </NTabPane>

        <NTabPane name="operator" tab="操作人信息">
          <NDescriptions bordered :column="1" size="small" label-placement="left" class="mt-8px">
            <NDescriptionsItem label="操作人账号">{{ detail.operName }}</NDescriptionsItem>
            <NDescriptionsItem label="操作人姓名">{{ detail.operNickName }}</NDescriptionsItem>
            <NDescriptionsItem label="所属部门">{{ detail.deptName }}</NDescriptionsItem>
            <NDescriptionsItem label="所属仓库">{{ detail.warehouseName }}</NDescriptionsItem>
          </NDescriptions>
        </NTabPane>

        <NTabPane name="object" tab="操作对象">
          <NDescriptions bordered :column="1" size="small" label-placement="left" class="mt-8px">
            <NDescriptionsItem label="操作对象">{{ detail.operObject }}</NDescriptionsItem>
            <NDescriptionsItem label="业务单号">{{ detail.bizNo }}</NDescriptionsItem>
          </NDescriptions>
        </NTabPane>

        <NTabPane name="change" tab="变更内容">
          <NDataTable
            v-if="(detail.changeFields || []).length"
            class="mt-8px"
            :columns="changeColumns"
            :data="detail.changeFields || []"
            size="small"
            :bordered="true"
          />
          <NEmpty v-else class="mt-20px" description="本次操作无字段变更记录" />
        </NTabPane>

        <NTabPane name="request" tab="请求信息">
          <NDescriptions bordered :column="1" size="small" label-placement="left" class="mt-8px">
            <NDescriptionsItem label="请求方式">
              <NTag size="small" :type="getRequestMethodTagType(detail.requestMethod || '')">
                {{ detail.requestMethod?.toUpperCase() }}
              </NTag>
            </NDescriptionsItem>
            <NDescriptionsItem label="请求URL">{{ detail.operUrl }}</NDescriptionsItem>
            <NDescriptionsItem label="IP地址">{{ detail.operIp }}</NDescriptionsItem>
            <NDescriptionsItem label="操作地点">{{ detail.operLocation }}</NDescriptionsItem>
            <NDescriptionsItem label="设备类型">{{ detail.deviceType }}</NDescriptionsItem>
          </NDescriptions>
          <div class="mt-12px text-13px font-medium">请求参数</div>
          <JsonPreview :code="detail.operParam" />
          <div class="mt-12px text-13px font-medium">返回结果</div>
          <JsonPreview :code="detail.jsonResult" />
        </NTabPane>

        <NTabPane name="risk" tab="风险分析">
          <div class="mt-8px rounded-8px border border-#e5e7eb p-12px text-13px">
            <div class="mb-8px font-medium" :style="riskStyle">
              {{ RISK_LEVEL_LABEL[detail.riskLevel || ''] }}（{{ detail.riskAnalysis?.score ?? 0 }} 分）
            </div>
            <ul class="mb-12px list-disc pl-18px">
              <li v-for="(f, idx) in detail.riskAnalysis?.factors || []" :key="idx">{{ f }}</li>
            </ul>
            <div>{{ detail.riskAnalysis?.suggestion }}</div>
          </div>
        </NTabPane>

        <NTabPane name="related" tab="关联日志">
          <NDataTable
            v-if="(detail.relatedLogs || []).length"
            class="mt-8px"
            :columns="[
              { key: 'logNo', title: '日志编号', width: 100 },
              { key: 'operTime', title: '时间', width: 155 },
              { key: 'operType', title: '类型', width: 100 },
              { key: 'summary', title: '摘要', ellipsis: { tooltip: true } }
            ]"
            :data="detail.relatedLogs || []"
            size="small"
          />
          <NEmpty v-else class="mt-20px" description="暂无同业务单号关联日志" />
        </NTabPane>
      </NTabs>
    </div>
    <NEmpty v-else description="暂无日志详情" />
  </NSpin>
</template>
