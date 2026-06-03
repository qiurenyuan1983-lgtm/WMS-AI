<script setup lang="ts">
import { ref, computed } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import {
  NAlert,
  NButton,
  NDataTable,
  NDivider,
  NInput,
  NPopover,
  NSwitch,
  NTag,
  useMessage
} from 'naive-ui';
import { fetchPublicTrailerCheckinLookup, fetchPublicTrailerCheckin } from '@/service/api/yms/gate';

defineOptions({ name: 'YmsH5TrailerCheckin' });

// ─── i18n ─────────────────────────────────────────────────────────────
const isEn = ref(false);
const t = (zh: string, en: string) => (isEn.value ? en : zh);

const message = useMessage();

// ─── Query ────────────────────────────────────────────────────────────
const pickupNoInput = ref('');
const searching = ref(false);
const lookupResult = ref<Api.Yms.TrailerCheckinLookup | null>(null);
const notFound = ref(false);

async function handleSearch() {
  if (!pickupNoInput.value.trim()) {
    message.warning(t('请输入提货号', 'Please enter Pick Up #'));
    return;
  }
  searching.value = true;
  lookupResult.value = null;
  notFound.value = false;
  try {
    const { data, error } = await fetchPublicTrailerCheckinLookup(pickupNoInput.value.trim());
    if (!error && data) {
      lookupResult.value = data;
      form.value.driverPhone = data.driverPhone ?? '';
      form.value.driverLicenseNo = data.driverLicenseNo ?? '';
      form.value.trailerNo = data.trailerNo ?? '';
    } else {
      notFound.value = true;
    }
  } finally {
    searching.value = false;
  }
}

function handleReset() {
  pickupNoInput.value = '';
  lookupResult.value = null;
  notFound.value = false;
  form.value = { driverPhone: '', driverLicenseNo: '', trailerNo: '' };
  submitted.value = false;
  submitResult.value = null;
}

// ─── Submit form ──────────────────────────────────────────────────────
const form = ref({ driverPhone: '', driverLicenseNo: '', trailerNo: '' });
const submitting = ref(false);
const submitted = ref(false);
const submitResult = ref<Api.Yms.TrailerCheckinSubmitResult | null>(null);

async function handleSubmit() {
  if (!form.value.driverPhone.trim()) {
    message.warning(t('请填写司机电话', 'Please enter phone number'));
    return;
  }
  if (!form.value.driverLicenseNo.trim()) {
    message.warning(t('请填写司机驾照号码', "Please enter driver's license number"));
    return;
  }
  if (!form.value.trailerNo.trim()) {
    message.warning(t('请填写车厢号', 'Please enter Trailer #'));
    return;
  }
  submitting.value = true;
  try {
    const { data, error } = await fetchPublicTrailerCheckin({
      pickupNo: pickupNoInput.value.trim(),
      driverPhone: form.value.driverPhone.trim(),
      driverLicenseNo: form.value.driverLicenseNo.trim(),
      trailerNo: form.value.trailerNo.trim()
    });
    if (!error && data) {
      submitResult.value = data;
      submitted.value = true;
    }
  } finally {
    submitting.value = false;
  }
}

// ─── Dispatch table ────────────────────────────────────────────────────
type DispatchItem = Api.Yms.TrailerDispatchItem;

const dispatchColumns = computed<DataTableColumns<DispatchItem>>(() => [
  { key: 'pcNo', title: 'PC号', width: 160, ellipsis: { tooltip: true } },
  { key: 'booker', title: t('预约方', 'Booker'), width: 100 },
  { key: 'bookedTime', title: t('预约时间', 'Booked Time'), width: 160 },
  { key: 'fromWarehouse', title: t('起始仓库', 'From Warehouse'), width: 120 },
  { key: 'destination', title: t('目的地', 'Destination'), width: 140, ellipsis: { tooltip: true } },
  { key: 'palletCount', title: t('板数', 'Pallets'), width: 70, align: 'right' },
  { key: 'weight', title: t('重量', 'Weight'), width: 80, align: 'right' },
  { key: 'loadingType', title: t('装车类型', 'Loading Type'), width: 100 },
  { key: 'boxCount', title: t('箱数', 'Boxes'), width: 70, align: 'right' },
  { key: 'priority', title: t('优先级', 'Priority'), width: 80, align: 'right', sorter: 'default' },
  { key: 'cbm', title: t('方数', 'CBM'), width: 70, align: 'right', sorter: 'default' }
]);

const statusTagType = computed((): 'success' | 'warning' | 'info' | 'error' | 'default' => {
  const s = lookupResult.value?.status ?? '';
  if (s === 'checked_in') return 'success';
  if (s === 'cancelled') return 'error';
  if (s === 'pending') return 'success';
  return 'default';
});
</script>

<template>
  <div class="min-h-screen bg-gray-100 py-8px px-16px">
    <!-- ── 查询卡片 ── -->
    <div class="mx-auto bg-white rounded-8px shadow-sm border border-gray-100" style="max-width: 1500px">
      <div class="px-24px pt-20px pb-24px">
        <!-- 标题 + 语言切换 -->
        <div class="flex items-center justify-between mb-16px">
          <h2 class="text-18px font-bold text-gray-800">
            {{ t('装车登记表', 'Loading Registration Form') }}
          </h2>
          <div class="flex items-center gap-8px text-14px select-none">
            <span :class="!isEn ? 'text-primary font-semibold' : 'text-gray-400'">中文</span>
            <NSwitch v-model:value="isEn" size="small" />
            <span :class="isEn ? 'text-primary font-semibold' : 'text-gray-400'">English</span>
          </div>
        </div>

        <NDivider style="margin: 0 0 16px" />

        <!-- 说明文字 -->
        <p class="text-14px text-gray-600 mb-8px leading-relaxed">
          {{
            t(
              '请提供以下信息以查询您需要的装货信息。查询到信息后，系统将显示派送明细:',
              'Please provide the following information to query the loading information. After the query, the system will display dispatch details:'
            )
          }}
        </p>
        <ol class="text-14px text-blue-500 pl-20px mb-20px" style="list-style: decimal; line-height: 2">
          <li>{{ t('签到时间', 'Check-In time') }}</li>
          <li>{{ t('手机号', 'Phone number') }}</li>
          <li>{{ t('驾照号码', "Driver's license number") }}</li>
          <li>Trailer#</li>
          <li>{{ t('截止时间', 'Deadline') }}</li>
        </ol>

        <!-- 提货号输入 -->
        <div class="flex items-center gap-12px">
          <label class="text-14px text-gray-700 shrink-0 w-180px">
            {{ t('提货号', 'Pick Up') }}(Pick Up #)
          </label>
          <NInput
            v-model:value="pickupNoInput"
            :placeholder="t('请输入提货号', 'Enter Pick Up #')"
            clearable
            class="flex-1"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <span class="i-mdi:file-document-outline text-gray-400 text-16px" />
            </template>
            <template #suffix>
              <NPopover trigger="hover">
                <template #trigger>
                  <span
                    class="w-20px h-20px rounded-full bg-gray-200 text-gray-500 text-11px flex items-center justify-center cursor-pointer hover:bg-gray-300 leading-none"
                  >?</span>
                </template>
                <span class="text-13px">
                  {{
                    t(
                      '请输入您收到的提货号（Pick Up #），系统将查询您的派送安排',
                      'Enter your Pick Up # to look up your dispatch information'
                    )
                  }}
                </span>
              </NPopover>
            </template>
          </NInput>
        </div>

        <!-- 操作按钮 -->
        <div class="flex gap-8px mt-16px">
          <NButton type="primary" :loading="searching" @click="handleSearch">
            <template #icon><span class="i-mdi:magnify" /></template>
            {{ t('查询', 'Query') }}
          </NButton>
          <NButton @click="handleReset">
            <template #icon><span class="i-mdi:refresh" /></template>
            {{ t('重置', 'Reset') }}
          </NButton>
        </div>

        <NAlert v-if="notFound" type="warning" class="mt-16px" :show-icon="true">
          {{
            t(
              '未查询到相关提货信息，请确认提货号是否正确',
              'Pick Up # not found. Please verify and try again.'
            )
          }}
        </NAlert>
      </div>
    </div>

    <!-- ── 结果区 ── -->
    <template v-if="lookupResult">
      <!-- 提货信息 -->
      <div class="mx-auto bg-white rounded-8px shadow-sm border border-gray-100 mt-16px" style="max-width: 1500px">
        <div class="px-24px py-16px">
          <div class="flex items-center justify-between mb-16px">
            <h3 class="text-16px font-semibold text-gray-800">
              {{ t('提货信息', 'Pickup Information') }}
            </h3>
            <NTag :type="statusTagType" size="small" round>{{ lookupResult.statusLabel }}</NTag>
          </div>

          <!-- 信息表格 -->
          <table class="w-full border-collapse text-14px" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden">
            <tbody>
              <tr style="border-bottom: 1px solid #e5e7eb">
                <td class="px-16px py-12px font-medium text-gray-600" style="width:200px; background:#f9fafb; border-right:1px solid #e5e7eb">
                  {{ t('提货号', 'Pick Up') }} (Pick Up #)
                </td>
                <td class="px-16px py-10px text-gray-800">{{ lookupResult.pickupNo }}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb">
                <td class="px-16px py-12px font-medium text-gray-600" style="background:#f9fafb; border-right:1px solid #e5e7eb">
                  {{ t('车次号', 'Route No.') }}
                </td>
                <td class="px-16px py-10px text-gray-800">{{ lookupResult.truckRouteNo ?? '-' }}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb">
                <td class="px-16px py-12px font-medium text-gray-600" style="background:#f9fafb; border-right:1px solid #e5e7eb">
                  {{ t('司机电话', 'Phone Number') }}
                </td>
                <td class="px-12px py-8px">
                  <NInput
                    v-model:value="form.driverPhone"
                    :placeholder="t('请输入司机电话', 'Enter phone number')"
                    :disabled="submitted"
                    style="max-width: 360px"
                  />
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb">
                <td class="px-16px py-12px font-medium text-gray-600" style="background:#f9fafb; border-right:1px solid #e5e7eb">
                  {{ t('司机驾照号码', "Driver's License") }}
                </td>
                <td class="px-12px py-8px">
                  <NInput
                    v-model:value="form.driverLicenseNo"
                    :placeholder="t('请输入驾照号码', 'Enter license number')"
                    :disabled="submitted"
                    style="max-width: 360px"
                  />
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb">
                <td class="px-16px py-12px font-medium text-gray-600" style="background:#f9fafb; border-right:1px solid #e5e7eb">
                  {{ t('车厢号', 'Trailer') }} (Trailer #)
                </td>
                <td class="px-12px py-8px">
                  <NInput
                    v-model:value="form.trailerNo"
                    placeholder="Trailer #"
                    :disabled="submitted"
                    style="max-width: 360px"
                  />
                </td>
              </tr>
              <tr>
                <td class="px-16px py-12px font-medium text-gray-600" style="background:#f9fafb; border-right:1px solid #e5e7eb">
                  {{ t('提货预约时间', 'Scheduled Time') }}
                </td>
                <td class="px-16px py-10px text-gray-800">{{ lookupResult.scheduledTime ?? '-' }}</td>
              </tr>
            </tbody>
          </table>

          <!-- 提交结果 -->
          <div v-if="submitted && submitResult" class="mt-16px">
            <NAlert :type="submitResult.success ? 'success' : 'error'" :show-icon="true">
              {{ submitResult.message }}
              <template v-if="submitResult.checkInNo">
                &nbsp;· {{ t('登记号', 'Check-in No.') }}: <strong>{{ submitResult.checkInNo }}</strong>
              </template>
            </NAlert>
          </div>

          <!-- 提交按钮 -->
          <div v-if="!submitted" class="mt-16px flex justify-end">
            <NButton type="primary" :loading="submitting" @click="handleSubmit">
              {{ t('提交登记', 'Submit Check-in') }}
            </NButton>
          </div>
        </div>
      </div>

      <!-- 派送明细 -->
      <div class="mx-auto bg-white rounded-8px shadow-sm border border-gray-100 mt-16px mb-32px" style="max-width: 1500px">
        <div class="px-24px py-16px">
          <h3 class="text-16px font-semibold text-gray-800 mb-16px">
            {{ t('派送明细', 'Dispatch Details') }}
          </h3>
          <NDataTable
            :columns="dispatchColumns"
            :data="lookupResult.dispatchItems"
            :bordered="true"
            size="small"
            :scroll-x="950"
          />
        </div>
      </div>
    </template>
  </div>
</template>
