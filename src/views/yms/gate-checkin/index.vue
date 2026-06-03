<script setup lang="ts">
import { onMounted, ref, watch, type Ref } from 'vue';
import {
  NAlert,
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NTabPane,
  NTabs,
  NTag,
  useMessage
} from 'naive-ui';
import { fetchGetWarehouseList } from '@/service/api/base';
import { fetchUnifiedCheckIn, fetchManualPass } from '@/service/api/yms/gate';
import { fetchGetYardDockList } from '@/service/api/yard';
import { fetchUploadFile } from '@/service/api/system/oss';
import { useAuth } from '@/hooks/business/auth';
import PhotoCapture from './modules/photo-capture.vue';

defineOptions({ name: 'YmsGateCheckin' });

const message = useMessage();
const { hasAuth } = useAuth();

// ─── 仓库 ─────────────────────────────────────────────────────────────────────
const warehouseOptions = ref<Array<{ label: string; value: CommonType.IdType }>>([]);
const warehouseId = ref<CommonType.IdType | null>(null);

async function loadWarehouses() {
  const { data } = await fetchGetWarehouseList({ pageNum: 1, pageSize: 200 } as any);
  const rows = (data as any)?.rows ?? [];
  warehouseOptions.value = rows.map((w: any) => ({ label: w.warehouseName, value: w.id }));
  if (warehouseOptions.value.length && !warehouseId.value) {
    warehouseId.value = warehouseOptions.value[0].value;
  }
}

// ─── 堆场位 ───────────────────────────────────────────────────────────────────
const positionOptions = ref<Array<{ label: string; value: string }>>([]);

async function loadPositions() {
  if (!warehouseId.value) return;
  const { data } = await fetchGetYardDockList({
    warehouseId: warehouseId.value,
    locationType: 'PARKING',
    dockStatus: 'IDLE',
    pageNum: 1,
    pageSize: 200
  } as any);
  const rows = (data as any)?.rows ?? [];
  positionOptions.value = rows.map((d: any) => ({
    label: `${d.dockCode}${d.zoneCode ? ' · ' + d.zoneCode : ''}`,
    value: d.dockCode
  }));
}

watch(warehouseId, loadPositions);

// ─── 照片 ─────────────────────────────────────────────────────────────────────
interface PhotoItem {
  file: File;
  previewUrl: string;
  ossUrl: string | null;
  uploading: boolean;
}

const containerPhotos = ref<PhotoItem[]>([]);
const trailerPhotos = ref<PhotoItem[]>([]);
type PhotoList = Ref<PhotoItem[]> | PhotoItem[];

function getPhotoItems(list: PhotoList) {
  return Array.isArray(list) ? list : list.value;
}

async function uploadOnePhoto(item: PhotoItem) {
  try {
    const { data, error } = await fetchUploadFile(item.file);
    if (!error && data) {
      item.ossUrl = (data as any).url ?? (data as any).ossUrl ?? null;
    } else {
      message.error('照片上传失败');
    }
  } finally {
    item.uploading = false;
  }
}

function addPhotos(list: PhotoList, files: FileList) {
  const items = getPhotoItems(list);
  Array.from(files).forEach(file => {
    const item: PhotoItem = { file, previewUrl: URL.createObjectURL(file), ossUrl: null, uploading: true };
    items.push(item);
    uploadOnePhoto(item);
  });
}

function removePhoto(list: PhotoList, idx: number) {
  const items = getPhotoItems(list);
  URL.revokeObjectURL(items[idx].previewUrl);
  items.splice(idx, 1);
}

function collectPhotoUrls(list: PhotoList): string | null {
  const urls = getPhotoItems(list).filter(p => p.ossUrl).map(p => p.ossUrl!);
  return urls.length ? JSON.stringify(urls) : null;
}

function clearPhotos(list: PhotoList) {
  const items = getPhotoItems(list);
  items.forEach(p => URL.revokeObjectURL(p.previewUrl));
  items.splice(0, items.length);
}

// ─── 表单：海柜 ───────────────────────────────────────────────────────────────
function defaultContainerForm() {
  return { containerNo: '', plateNo: '', driverName: '', driverPhone: '', idCardNo: '', positionCode: null as string | null, remark: '' };
}
const containerForm = ref(defaultContainerForm());

function resetContainerForm() {
  containerForm.value = defaultContainerForm();
  clearPhotos(containerPhotos);
}

// ─── 表单：装车 ───────────────────────────────────────────────────────────────
const vehicleSourceOptions = [
  { label: '供应商车辆', value: 'SUPPLIER_TRUCK' },
  { label: '租赁车厢',   value: 'RENTED_TRAILER' },
  { label: '自有车厢',   value: 'OWN_TRAILER' },
  { label: '临时车辆',   value: 'TEMP_TRUCK' }
];

function defaultTrailerForm() {
  return {
    loadingNo: '',
    plateNo: '',
    trailerNo: '',
    vehicleSource: null as string | null,
    driverName: '',
    driverPhone: '',
    idCardNo: '',
    positionCode: null as string | null,
    remark: ''
  };
}
const trailerForm = ref(defaultTrailerForm());

function resetTrailerForm() {
  trailerForm.value = defaultTrailerForm();
  clearPhotos(trailerPhotos);
}

// ─── 提交与结果 ───────────────────────────────────────────────────────────────
const activeTab = ref<'container' | 'trailer'>('container');
const submitting = ref(false);
const checkInResult = ref<Api.Yms.CheckIn | null>(null);
const lastCheckInId = ref<CommonType.IdType | null>(null);
const manualPassing = ref(false);

const RESULT_COLOR = { PASSED: 'success', REJECTED: 'error', PENDING: 'warning' } as const;
const RESULT_LABEL = { PASSED: '放行入场', REJECTED: '已拒绝', PENDING: '待确认' } as const;
const FIELD_LABELS: Record<string, string> = { plate_no: '车牌号', driver_name: '司机姓名', driver_phone: '司机手机号' };

function getMismatchFields() {
  if (!checkInResult.value?.omsMismatchFields) return [];
  try { return JSON.parse(checkInResult.value.omsMismatchFields); } catch { return []; }
}

async function handleSubmit() {
  if (!warehouseId.value) { message.warning('请先选择仓库'); return; }

  const isContainer = activeTab.value === 'container';
  const photoList = isContainer ? containerPhotos : trailerPhotos;

  if (isContainer && !containerForm.value.containerNo.trim()) {
    message.warning('请填写海柜号'); return;
  }
  if (!isContainer && !trailerForm.value.loadingNo.trim()) {
    message.warning('请填写装车号'); return;
  }
  if (photoList.value.some(p => p.uploading)) {
    message.warning('照片上传中，请稍候再提交'); return;
  }

  const common = { warehouseId: warehouseId.value, photoUrls: collectPhotoUrls(photoList) };
  const body: Api.Yms.UnifiedCheckInParams = isContainer
    ? {
        ...common,
        containerNo: containerForm.value.containerNo.trim() || null,
        plateNo: containerForm.value.plateNo.trim() || null,
        driverName: containerForm.value.driverName.trim() || null,
        driverPhone: containerForm.value.driverPhone.trim() || null,
        idCardNo: containerForm.value.idCardNo.trim() || null,
        positionCode: containerForm.value.positionCode,
        remark: containerForm.value.remark.trim() || null
      }
    : {
        ...common,
        loadingNo: trailerForm.value.loadingNo.trim() || null,
        plateNo: trailerForm.value.plateNo.trim() || null,
        trailerNo: trailerForm.value.trailerNo.trim() || null,
        vehicleSource: trailerForm.value.vehicleSource,
        driverName: trailerForm.value.driverName.trim() || null,
        driverPhone: trailerForm.value.driverPhone.trim() || null,
        idCardNo: trailerForm.value.idCardNo.trim() || null,
        positionCode: trailerForm.value.positionCode,
        remark: trailerForm.value.remark.trim() || null
      };

  submitting.value = true;
  try {
    const { data, error } = await fetchUnifiedCheckIn(body);
    if (!error && data) {
      checkInResult.value = data;
      lastCheckInId.value = data.id;
      if (data.checkResult === 'PASSED') {
        message.success('Check-in 成功，放行入场');
        isContainer ? resetContainerForm() : resetTrailerForm();
        loadPositions();
      } else if (data.checkResult === 'REJECTED') {
        message.error('Check-in 拒绝：' + (data.rejectReason ?? ''));
      } else {
        message.warning('Check-in 待确认：' + (data.rejectReason ?? ''));
      }
    }
  } finally {
    submitting.value = false;
  }
}

async function handleManualPass() {
  if (!lastCheckInId.value) return;
  manualPassing.value = true;
  try {
    const { data, error } = await fetchManualPass(lastCheckInId.value, '门岗手动放行');
    if (!error && data) {
      checkInResult.value = data;
      message.success('已手动放行');
      activeTab.value === 'container' ? resetContainerForm() : resetTrailerForm();
      loadPositions();
    }
  } finally {
    manualPassing.value = false;
  }
}

onMounted(async () => {
  await loadWarehouses();
  await loadPositions();
});
</script>

<template>
  <div class="h-full overflow-y-auto p-16px bg-gray-50">
    <div class="max-w-860px mx-auto flex flex-col gap-16px">

      <!-- 仓库选择 -->
      <NCard :bordered="false" class="card-wrapper">
        <div class="flex items-center gap-12px flex-wrap">
          <span class="text-14px font-semibold text-gray-700 whitespace-nowrap">当前仓库</span>
          <NSelect
            v-model:value="warehouseId"
            :options="warehouseOptions"
            placeholder="选择仓库"
            class="w-240px"
          />
          <span class="text-12px text-gray-400 hidden sm:block">门岗统一 Check-in 操作台</span>
        </div>
      </NCard>

      <!-- 结果卡片 -->
      <NCard v-if="checkInResult" :bordered="false" class="card-wrapper">
        <div class="flex items-center justify-between mb-12px flex-wrap gap-8px">
          <div class="flex items-center gap-8px flex-wrap">
            <NTag
              :type="RESULT_COLOR[checkInResult.checkResult as keyof typeof RESULT_COLOR] ?? 'default'"
              size="large"
            >
              {{ RESULT_LABEL[checkInResult.checkResult as keyof typeof RESULT_LABEL] ?? checkInResult.checkResult }}
            </NTag>
            <span class="text-15px font-semibold">
              {{ checkInResult.containerNo || checkInResult.yardTaskNo || checkInResult.trailerNo || checkInResult.plateNo }}
            </span>
            <span v-if="checkInResult.receiptNo" class="text-12px text-gray-400">
              小票 {{ checkInResult.receiptNo }}
            </span>
          </div>
          <NButton size="small" @click="checkInResult = null; lastCheckInId = null">新建登记</NButton>
        </div>

        <NAlert v-if="checkInResult.omsMismatchFlag === 1" type="warning" class="mb-10px" title="与OMS预期数据不一致">
          <NTag v-for="f in getMismatchFields()" :key="f" size="tiny" type="warning" class="mr-4px">
            {{ FIELD_LABELS[f] ?? f }}
          </NTag>
          与预期不符，已放行，请人工核查
        </NAlert>

        <NAlert v-if="checkInResult.checkResult === 'REJECTED'" type="error" class="mb-10px">
          {{ checkInResult.rejectReason }}
        </NAlert>

        <div v-if="checkInResult.checkResult === 'PENDING'" class="flex items-center gap-8px mb-10px">
          <NAlert type="warning" class="flex-1">{{ checkInResult.rejectReason }}</NAlert>
          <NButton
            v-if="hasAuth('yms:gate:checkIn')"
            type="warning"
            :loading="manualPassing"
            @click="handleManualPass"
          >
            手动放行
          </NButton>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-8px text-13px text-gray-600">
          <div v-if="checkInResult.containerNo"><span class="text-gray-400">海柜号：</span>{{ checkInResult.containerNo }}</div>
          <div v-if="!checkInResult.containerNo && checkInResult.yardTaskNo"><span class="text-gray-400">装车号：</span>{{ checkInResult.yardTaskNo }}</div>
          <div v-if="checkInResult.plateNo"><span class="text-gray-400">车牌：</span>{{ checkInResult.plateNo }}</div>
          <div v-if="checkInResult.driverPhone"><span class="text-gray-400">司机电话：</span>{{ checkInResult.driverPhone }}</div>
          <div v-if="checkInResult.positionCode"><span class="text-gray-400">堆场位：</span>{{ checkInResult.positionCode }}</div>
          <div v-if="checkInResult.yardTaskNo"><span class="text-gray-400">关联任务：</span>{{ checkInResult.yardTaskNo }}</div>
        </div>
      </NCard>

      <!-- 主表单 -->
      <NCard v-else :bordered="false" class="card-wrapper">
        <NTabs v-model:value="activeTab" type="segment" animated>

          <!-- ── 海柜入场 ──────────────────────────────────────── -->
          <NTabPane name="container">
            <template #tab>
              <span>🚢 海柜入场</span>
            </template>
            <NForm label-placement="top" :show-feedback="false" class="mt-8px">
              <p class="text-12px text-gray-400 mb-12px">适用：海外进口柜、海柜拆柜作业</p>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-16px">
                <NFormItem label="海柜号 *">
                  <NInput v-model:value="containerForm.containerNo" placeholder="如 MSKU1234567" clearable />
                </NFormItem>
                <NFormItem label="车牌号">
                  <NInput v-model:value="containerForm.plateNo" placeholder="可选" clearable />
                </NFormItem>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-x-16px mt-4px">
                <NFormItem label="司机姓名">
                  <NInput v-model:value="containerForm.driverName" placeholder="可选" clearable />
                </NFormItem>
                <NFormItem label="司机手机">
                  <NInput v-model:value="containerForm.driverPhone" placeholder="可选" clearable />
                </NFormItem>
                <NFormItem label="身份证号">
                  <NInput v-model:value="containerForm.idCardNo" placeholder="可选" clearable />
                </NFormItem>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-16px mt-4px">
                <NFormItem label="分配堆场位">
                  <NSelect
                    v-model:value="containerForm.positionCode"
                    :options="positionOptions"
                    placeholder="选填，指定堆场位或道口"
                    clearable filterable
                  />
                </NFormItem>
                <NFormItem label="备注">
                  <NInput v-model:value="containerForm.remark" placeholder="可选" clearable />
                </NFormItem>
              </div>

              <PhotoCapture
                :photos="containerPhotos"
                label="现场拍照（可选）"
                tip="建议拍摄：车头照、柜号照、铅封照"
                @add="(files) => addPhotos(containerPhotos, files)"
                @remove="(idx) => removePhoto(containerPhotos, idx)"
              />

              <div class="flex justify-end gap-8px mt-20px">
                <NButton @click="resetContainerForm">清空</NButton>
                <NButton type="primary" :loading="submitting" @click="handleSubmit">放行入场</NButton>
              </div>
            </NForm>
          </NTabPane>

          <!-- ── 装车入场 ──────────────────────────────────────── -->
          <NTabPane name="trailer">
            <template #tab>
              <span>🚛 装车入场</span>
            </template>
            <NForm label-placement="top" :show-feedback="false" class="mt-8px">
              <p class="text-12px text-gray-400 mb-12px">适用：出库装车任务入场。先录入装车号，系统匹配任务池后同步实际抵仓时间。</p>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-16px">
                <NFormItem label="装车号 *">
                  <NInput v-model:value="trailerForm.loadingNo" placeholder="请输入装车号/出库单号/园区任务号" clearable />
                </NFormItem>
                <NFormItem label="车厢号">
                  <NInput v-model:value="trailerForm.trailerNo" placeholder="租赁/自有车厢时填写" clearable />
                </NFormItem>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-16px mt-4px">
                <NFormItem label="车辆来源">
                  <NSelect
                    v-model:value="trailerForm.vehicleSource"
                    :options="vehicleSourceOptions"
                    placeholder="可选"
                    clearable
                  />
                </NFormItem>
                <NFormItem label="车牌号">
                  <NInput v-model:value="trailerForm.plateNo" placeholder="可选，现场核验车辆时填写" clearable />
                </NFormItem>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-16px mt-4px">
                <NFormItem label="分配堆场位">
                  <NSelect
                    v-model:value="trailerForm.positionCode"
                    :options="positionOptions"
                    placeholder="选填"
                    clearable filterable
                  />
                </NFormItem>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-x-16px mt-4px">
                <NFormItem label="司机姓名">
                  <NInput v-model:value="trailerForm.driverName" placeholder="可选" clearable />
                </NFormItem>
                <NFormItem label="司机手机">
                  <NInput v-model:value="trailerForm.driverPhone" placeholder="可选" clearable />
                </NFormItem>
                <NFormItem label="身份证号">
                  <NInput v-model:value="trailerForm.idCardNo" placeholder="可选" clearable />
                </NFormItem>
              </div>

              <NFormItem label="备注" class="mt-4px">
                <NInput v-model:value="trailerForm.remark" placeholder="可选" clearable />
              </NFormItem>

              <PhotoCapture
                :photos="trailerPhotos"
                label="现场拍照（可选）"
                tip="建议拍摄：车头照、车厢照、车牌照"
                @add="(files) => addPhotos(trailerPhotos, files)"
                @remove="(idx) => removePhoto(trailerPhotos, idx)"
              />

              <div class="flex justify-end gap-8px mt-20px">
                <NButton @click="resetTrailerForm">清空</NButton>
                <NButton type="primary" :loading="submitting" @click="handleSubmit">放行入场</NButton>
              </div>
            </NForm>
          </NTabPane>

        </NTabs>
      </NCard>

    </div>
  </div>
</template>
