<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { NButton, NForm, NFormItem, NInput, NSelect, useMessage } from 'naive-ui';
import { useRoute } from 'vue-router';
import { fetchDriverSelfCheckIn, fetchPublicParkingSlots } from '@/service/api/yms/gate';
import { fetchUploadFile } from '@/service/api/system/oss';

defineOptions({ name: 'YmsH5DriverCheckin' });

const route = useRoute();
const message = useMessage();

const warehouseId = ref<CommonType.IdType | null>(null);
const tenantId = ref<string>('');

const form = ref({
  objectNo: '',
  positionCode: '',
  driverPhone: '',
  driverName: ''
});

const positionOptions = ref<Array<{ label: string; value: string }>>([]);
const submitting = ref(false);
const submitted = ref(false);
const resultMsg = ref('');
const resultTaskNo = ref('');
const resultPosition = ref('');
const resultSuccess = ref(false);

// ─── 拍照 ─────────────────────────────────────────────────────────────────────

interface PhotoItem {
  file: File;
  previewUrl: string;
  ossUrl: string | null;
  uploading: boolean;
}

const photos = ref<PhotoItem[]>([]);

function onPhotoSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files) return;
  Array.from(input.files).forEach(file => {
    const previewUrl = URL.createObjectURL(file);
    const item: PhotoItem = { file, previewUrl, ossUrl: null, uploading: true };
    photos.value.push(item);
    uploadPhoto(item);
  });
  input.value = '';
}

async function uploadPhoto(item: PhotoItem) {
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

function removePhoto(idx: number) {
  URL.revokeObjectURL(photos.value[idx].previewUrl);
  photos.value.splice(idx, 1);
}

// ─── 堆场位 ───────────────────────────────────────────────────────────────────

async function loadPositions() {
  if (!warehouseId.value || !tenantId.value) return;
  const { data } = await fetchPublicParkingSlots(warehouseId.value, tenantId.value);
  const list = (data as any) ?? [];
  positionOptions.value = list.map((s: any) => ({
    label: `${s.dockCode}${s.dockName && s.dockName !== s.dockCode ? ' - ' + s.dockName : ''}${s.zoneCode ? ' (' + s.zoneCode + ')' : ''}`,
    value: s.dockCode
  }));
}

// ─── 提交 ─────────────────────────────────────────────────────────────────────

async function handleSubmit() {
  if (!form.value.objectNo.trim()) {
    message.warning('请填写海柜号');
    return;
  }
  if (!form.value.positionCode) {
    message.warning('请选择堆场位');
    return;
  }
  if (!form.value.driverPhone.trim()) {
    message.warning('请填写司机手机号');
    return;
  }
  if (!warehouseId.value || !tenantId.value) {
    message.error('链接参数无效，请重新扫描二维码');
    return;
  }
  const stillUploading = photos.value.some(p => p.uploading);
  if (stillUploading) {
    message.warning('照片上传中，请稍候再提交');
    return;
  }

  const photoUrlList = photos.value.filter(p => p.ossUrl).map(p => p.ossUrl!);
  const photoUrls = photoUrlList.length ? JSON.stringify(photoUrlList) : null;

  submitting.value = true;
  try {
    const { data, error } = await fetchDriverSelfCheckIn({
      tenantId: tenantId.value,
      warehouseId: warehouseId.value,
      objectNo: form.value.objectNo.trim(),
      positionCode: form.value.positionCode,
      driverPhone: form.value.driverPhone.trim(),
      driverName: form.value.driverName.trim() || null,
      photoUrls
    });
    if (!error && data) {
      resultSuccess.value = data.success;
      resultMsg.value = data.message;
      resultTaskNo.value = data.yardTaskNo ?? '';
      resultPosition.value = data.positionCode ?? form.value.positionCode;
      submitted.value = true;
    }
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  const wid = route.query.warehouseId;
  const tid = route.query.tenantId;
  if (wid && tid) {
    warehouseId.value = Number(wid) as CommonType.IdType;
    tenantId.value = String(tid);
    loadPositions();
  }
});
</script>

<template>
  <div class="h5-driver-checkin min-h-screen bg-gray-50 flex flex-col" style="font-size:15px">
    <!-- 顶部 -->
    <div class="bg-primary-600 text-white px-16px py-14px flex items-center gap-8px shadow-sm">
      <div class="i-mdi:truck text-22px" />
      <span class="text-17px font-semibold">司机签到</span>
    </div>

    <!-- 提交成功 -->
    <div v-if="submitted" class="flex-1 flex flex-col items-center justify-center px-24px gap-12px">
      <div
        class="w-80px h-80px rounded-full flex items-center justify-center text-36px"
        :class="resultSuccess ? 'bg-green-100' : 'bg-red-100'"
      >
        {{ resultSuccess ? '✅' : '❌' }}
      </div>
      <p class="text-20px font-bold" :class="resultSuccess ? 'text-green-600' : 'text-red-500'">
        {{ resultSuccess ? '签到成功' : '签到失败' }}
      </p>
      <p class="text-14px text-gray-500 text-center leading-relaxed">{{ resultMsg }}</p>
      <div v-if="resultSuccess" class="bg-white rounded-12px p-16px w-full max-w-320px shadow-sm text-14px">
        <div v-if="resultPosition" class="flex justify-between py-6px border-b border-gray-100">
          <span class="text-gray-500">堆场位</span>
          <span class="font-medium">{{ resultPosition }}</span>
        </div>
        <div v-if="resultTaskNo" class="flex justify-between py-6px">
          <span class="text-gray-500">任务号</span>
          <span class="font-medium">{{ resultTaskNo }}</span>
        </div>
      </div>
      <NButton v-if="!resultSuccess" type="primary" size="large" class="mt-8px" @click="submitted = false">
        重新填写
      </NButton>
    </div>

    <!-- 签到表单 -->
    <div v-else class="flex-1 px-16px py-20px">
      <NForm label-placement="top" :show-feedback="false">

        <NFormItem label="海柜号 *">
          <NInput
            v-model:value="form.objectNo"
            placeholder="请输入海柜号"
            size="large"
            clearable
          />
        </NFormItem>

        <NFormItem label="堆场位 *" class="mt-16px">
          <NSelect
            v-model:value="form.positionCode"
            :options="positionOptions"
            placeholder="请选择您的堆场位"
            size="large"
            filterable
          />
        </NFormItem>

        <NFormItem label="司机手机号 *" class="mt-16px">
          <NInput
            v-model:value="form.driverPhone"
            placeholder="请输入手机号"
            size="large"
            clearable
          />
        </NFormItem>

        <NFormItem label="司机姓名（选填）" class="mt-16px">
          <NInput
            v-model:value="form.driverName"
            placeholder="选填"
            size="large"
            clearable
          />
        </NFormItem>

        <!-- 拍照上传 -->
        <div class="mt-20px">
          <div class="text-14px text-gray-600 mb-10px font-medium">现场照片（选填）</div>

          <!-- 照片预览网格 -->
          <div class="grid grid-cols-3 gap-8px mb-10px">
            <div
              v-for="(photo, idx) in photos"
              :key="idx"
              class="relative aspect-square rounded-8px overflow-hidden bg-gray-100"
            >
              <img :src="photo.previewUrl" class="w-full h-full object-cover" />
              <!-- 上传中遮罩 -->
              <div
                v-if="photo.uploading"
                class="absolute inset-0 bg-black/40 flex items-center justify-center"
              >
                <div class="i-mdi:loading animate-spin text-white text-24px" />
              </div>
              <!-- 删除按钮 -->
              <button
                v-else
                class="absolute top-4px right-4px w-20px h-20px bg-black/50 rounded-full flex items-center justify-center"
                @click="removePhoto(idx)"
              >
                <div class="i-mdi:close text-white text-12px" />
              </button>
            </div>

            <!-- 添加按钮 -->
            <label
              v-if="photos.length < 6"
              class="aspect-square rounded-8px border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-4px cursor-pointer bg-white active:bg-gray-50"
            >
              <div class="i-mdi:camera-outline text-28px text-gray-400" />
              <span class="text-12px text-gray-400">拍照</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                class="hidden"
                @change="onPhotoSelect"
              />
            </label>
          </div>
          <p class="text-12px text-gray-400">最多上传 6 张，建议拍摄车牌 / 柜号照片</p>
        </div>

        <NButton
          type="primary"
          block
          size="large"
          class="mt-24px"
          :loading="submitting"
          @click="handleSubmit"
        >
          提交签到
        </NButton>
      </NForm>
    </div>
  </div>
</template>
