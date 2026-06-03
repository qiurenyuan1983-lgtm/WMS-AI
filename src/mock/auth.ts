export const MOCK_TOKEN: Api.Auth.LoginToken = {
  access_token: 'mock-access-token-prototype',
  refresh_token: 'mock-refresh-token-prototype',
  expire_in: 7200,
  refresh_expire_in: 86400,
  client_id: import.meta.env.VITE_APP_CLIENT_ID,
  scope: 'all'
};

export const MOCK_USER_INFO: Api.Auth.UserInfo = {
  user: {
    userId: 1,
    userName: 'admin',
    nickName: '原型管理员',
    email: 'admin@mock.local',
    phonenumber: '13800000000',
    sex: '0',
    avatar: '',
    status: '0',
    deptId: 100,
    deptName: '研发部门',
    roles: [{ roleId: 1, roleName: '超级管理员', roleKey: 'admin' } as Api.System.Role]
  } as Api.System.User & { roles: Api.System.Role[] },
  roles: ['admin', 'R_SUPER'],
  permissions: ['*:*:*']
};

export const MOCK_CAPTCHA: Api.Auth.CaptchaCode = {
  captchaEnabled: false,
  uuid: 'mock-captcha-uuid'
};

export const MOCK_TENANT_LIST: Api.Auth.LoginTenant = {
  tenantEnabled: false,
  voList: [{ tenantId: '000000', companyName: '演示租户', domain: '' }]
};
