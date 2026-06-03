<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { SelectOption } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import CryptoJS from 'crypto-js';
import { fetchCaptchaCode, fetchTenantList } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { localStg } from '@/utils/storage';
import { decryptWithAes, encryptWithAes } from '@/utils/crypto';
import { $t } from '@/locales';

const aesKey = CryptoJS.enc.Utf8.parse(import.meta.env.VITE_REMEMBER_ME_AES_KEY || 'pC4aO6cD2uU7hA0bK6iD4vE1mV8sU8xG');

defineOptions({
  name: 'PwdLogin'
});

const authStore = useAuthStore();
const { formRef, validate } = useNaiveForm();
const { loading: codeLoading, startLoading: startCodeLoading, endLoading: endCodeLoading } = useLoading();
const { loading: tenantLoading, startLoading: startTenantLoading, endLoading: endTenantLoading } = useLoading();

const codeUrl = ref<string>();
const captchaEnabled = ref<boolean>(false);
const remberMe = ref<boolean>(false);
const tenantEnabled = ref<boolean>(false);
const tenantOption = ref<SelectOption[]>([]);

const model: Api.Auth.PwdLoginForm = reactive({
  tenantId: '000000',
  username: 'admin',
  password: 'admin123'
});

type RuleKey = Extract<keyof Api.Auth.PwdLoginForm, 'username' | 'password' | 'code' | 'tenantId'>;

const rules = computed<Record<RuleKey, App.Global.FormRule[]>>(() => {
  const { formRules, createRequiredRule } = useFormRules();

  return {
    username: [createRequiredRule($t('form.userName.required'))],
    password: [createRequiredRule($t('form.pwd.required'))],
    code: captchaEnabled.value ? [createRequiredRule($t('form.code.required'))] : [],
    tenantId: tenantEnabled.value ? formRules.tenantId : []
  };
});

async function handleFetchTenantList() {
  startTenantLoading();
  const { data, error } = await fetchTenantList();
  if (error) return;
  tenantEnabled.value = data.tenantEnabled;
  if (data.tenantEnabled) {
    tenantOption.value = data.voList.map(tenant => ({
      label: tenant.companyName,
      value: tenant.tenantId
    }));
  }
  endTenantLoading();
}

handleFetchTenantList();

async function handleSubmit() {
  await validate();
  if (remberMe.value) {
    const { tenantId, username, password } = model;
    localStg.set('loginRember', encryptWithAes(JSON.stringify({ tenantId, username, password }), aesKey));
  } else {
    localStg.remove('loginRember');
  }
  try {
    await authStore.login(model);
  } catch {
    handleFetchCaptchaCode();
  }
}

async function handleFetchCaptchaCode() {
  startCodeLoading();
  const { data, error } = await fetchCaptchaCode();
  if (!error) {
    captchaEnabled.value = data.captchaEnabled;
    if (data.captchaEnabled) {
      model.uuid = data.uuid;
      codeUrl.value = `data:image/gif;base64,${data.img}`;
    }
  }
  endCodeLoading();
}

handleFetchCaptchaCode();

function handleLoginRember() {
  const loginRember = localStg.get('loginRember');
  if (!loginRember) return;
  try {
    remberMe.value = true;
    Object.assign(model, JSON.parse(decryptWithAes(loginRember, aesKey)));
  } catch {}
}

handleLoginRember();

function handleSupplierPortal() {
  window.$message?.info('供应商门户功能即将开放');
}
</script>

<template>
  <div class="forest-pwd-login">
    <div class="forest-pwd-login-head">
      <h2 class="forest-pwd-login-title">欢迎登录</h2>
      <p class="forest-pwd-login-desc">使用企业账号登录系统</p>
    </div>

    <NForm
      ref="formRef"
      class="forest-pwd-login-form"
      :model="model"
      :rules="rules"
      size="large"
      label-placement="top"
      :show-require-mark="false"
      @keyup.enter="() => !authStore.loginLoading && handleSubmit()"
    >
      <NFormItem v-if="tenantEnabled" path="tenantId" label="租户">
        <NSelect
          v-model:value="model.tenantId"
          placeholder="请选择租户"
          :options="tenantOption"
          :loading="tenantLoading"
        />
      </NFormItem>

      <NFormItem path="username" label="账号">
        <NInput
          v-model:value="model.username"
          class="forest-field-input"
          placeholder="请输入账号"
        />
      </NFormItem>

      <NFormItem path="password" label="密码">
        <NInput
          v-model:value="model.password"
          class="forest-field-input"
          type="password"
          show-password-on="click"
          placeholder="请输入密码"
        />
      </NFormItem>

      <NFormItem v-if="captchaEnabled" path="code" label="验证码">
        <div class="w-full flex-y-center gap-12px">
          <NInput v-model:value="model.code" class="forest-field-input" placeholder="请输入验证码" />
          <NSpin :show="codeLoading" :size="28" class="h-48px">
            <NButton :focusable="false" class="login-code h-48px w-120px" @click="handleFetchCaptchaCode">
              <img v-if="codeUrl" :src="codeUrl" alt="验证码" />
              <NEmpty v-else :show-icon="false" description="暂无验证码" />
            </NButton>
          </NSpin>
        </div>
      </NFormItem>

      <div class="forest-pwd-login-options">
        <NCheckbox v-model:checked="remberMe" class="forest-remember">记住密码</NCheckbox>
      </div>

      <NButton
        type="primary"
        size="large"
        block
        class="forest-login-btn"
        :loading="authStore.loginLoading"
        @click="handleSubmit"
      >
        登录
      </NButton>

      <div class="forest-login-divider">
        <span>或</span>
      </div>

      <NButton size="large" block class="forest-supplier-btn" @click="handleSupplierPortal">
        供应商门户
      </NButton>
    </NForm>

    <p class="forest-login-footer">
      遇到问题？
      <a href="mailto:admin@forest-wms.com" class="forest-login-link">联系管理员</a>
    </p>
  </div>
</template>

<style scoped>
.forest-pwd-login {
  color: #fff;
}

.forest-pwd-login-head {
  margin-bottom: 22px;
}

.forest-pwd-login-title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  line-height: 1.2;
  color: #fff;
}

.forest-pwd-login-desc {
  margin: 8px 0 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.78);
}

:deep(.forest-pwd-login-form .n-form-item-label) {
  padding-bottom: 0;
}

:deep(.forest-pwd-login-form .n-form-item-label__text) {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
}

.forest-pwd-login-options {
  margin: 4px 0 18px;
}

.forest-remember {
  --n-text-color: rgba(255, 255, 255, 0.88) !important;
}

.forest-login-btn {
  height: 48px !important;
  border-radius: 999px !important;
  font-size: 17px !important;
  font-weight: 700 !important;
  background: linear-gradient(90deg, #2563eb, #0284c7) !important;
  border: none !important;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.35);
}

.forest-login-divider {
  position: relative;
  margin: 20px 0 16px;
  text-align: center;
}

.forest-login-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.22);
}

.forest-login-divider span {
  position: relative;
  z-index: 1;
  padding: 0 12px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.72);
  background: transparent;
}

.forest-supplier-btn {
  height: 48px !important;
  border-radius: 999px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  color: #0f172a !important;
  background: rgba(255, 255, 255, 0.88) !important;
  border: none !important;
}

.forest-login-footer {
  margin: 22px 0 0;
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.72);
}

.forest-login-link {
  color: #7dd3fc;
  text-decoration: none;
}

.forest-login-link:hover {
  text-decoration: underline;
}

.login-code {
  &.n-button {
    --n-padding: 0 !important;
    border-radius: 999px !important;
    overflow: hidden;
  }

  img {
    height: 48px;
    width: 100%;
    object-fit: cover;
  }
}

:deep(.forest-pwd-login-form .n-form-item) {
  margin-bottom: 16px;
}

:deep(.forest-pwd-login-form .n-form-item-label) {
  padding-bottom: 0;
}

:deep(.forest-field-input.n-input),
:deep(.forest-pwd-login-form .n-base-selection) {
  --n-height: 48px !important;
  --n-font-size: 15px !important;
  --n-border-radius: 999px !important;
  --n-color: rgba(255, 255, 255, 0.95) !important;
  --n-border: 1px solid rgba(255, 255, 255, 0.08) !important;
  --n-box-shadow-focus: 0 0 0 2px rgba(56, 189, 248, 0.35) !important;
}

:deep(.forest-field-input .n-input__input-el) {
  color: #0f172a;
}

:deep(.forest-remember.n-checkbox) {
  --n-size: 18px !important;
  --n-font-size: 14px !important;
  --n-color-checked: #2563eb !important;
  --n-border-checked: #2563eb !important;
}
</style>
