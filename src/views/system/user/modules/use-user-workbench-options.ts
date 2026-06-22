import { ref } from 'vue';
import { fetchGetDeptTree } from '@/service/api/system';
import { fetchGetPostList } from '@/service/api/system/post';
import { fetchGetRoleList } from '@/service/api/system/role';

export type UserWorkbenchSharedOptions = {
  deptData: Api.Common.CommonTreeRecord;
  postOptions: CommonType.Option[];
  roleOptions: CommonType.Option[];
};

const loading = ref(false);
const ready = ref(false);
const options = ref<UserWorkbenchSharedOptions>({
  deptData: [],
  postOptions: [],
  roleOptions: []
});

let loadPromise: Promise<UserWorkbenchSharedOptions> | null = null;

/** 部门 / 岗位 / 角色选项只加载一次，供工作台各子组件共享 */
export function useUserWorkbenchOptions() {
  async function ensureLoaded() {
    if (ready.value) return options.value;
    if (!loadPromise) {
      loading.value = true;
      loadPromise = Promise.all([
        fetchGetDeptTree(),
        fetchGetPostList({ pageNum: 1, pageSize: 100, status: '0' }),
        fetchGetRoleList({ pageNum: 1, pageSize: 100, status: '0' })
      ]).then(([deptRes, postRes, roleRes]) => {
        const next: UserWorkbenchSharedOptions = {
          deptData: deptRes.error ? [] : deptRes.data || [],
          postOptions: (postRes.data?.rows || []).map(p => ({ label: p.postName, value: p.postId })),
          roleOptions: (roleRes.data?.rows || []).map(r => ({ label: r.roleName, value: r.roleId }))
        };
        options.value = next;
        ready.value = true;
        loading.value = false;
        return next;
      });
    }
    return loadPromise;
  }

  return {
    options,
    loading,
    ready,
    ensureLoaded
  };
}
