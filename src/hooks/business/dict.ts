import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { getMockDictByType, isMockMode } from '@/mock';
import { fetchGetDictDataByType } from '@/service/api/system';
import { useDictStore } from '@/store/modules/dict';
import { isNull } from '@/utils/common';
import { $t } from '@/locales';

export function useDict(dictType: string, immediate: boolean = true) {
  const dictStore = useDictStore();
  const { dictData: dictList } = storeToRefs(dictStore);

  const data = ref<Api.System.DictData[]>([]);
  const record = ref<Record<string, Api.System.DictData>>({});
  const options = ref<CommonType.Option[]>([]);

  async function getData() {
    const dicts = dictStore.getDict(dictType);
    if (dicts?.length) {
      data.value = dicts;
      return;
    }
    let dictData: Api.System.DictData[];
    if (isMockMode()) {
      dictData = getMockDictByType(dictType);
    } else {
      const { data, error } = await fetchGetDictDataByType(dictType);
      if (error) return;
      dictData = data;
    }
    dictData.forEach(dict => {
      if (dict.dictLabel?.startsWith(`dict.${dictType}.`)) {
        dict.dictLabel = $t(dict.dictLabel as App.I18n.I18nKey);
      }
    });
    dictStore.setDict(dictType, dictData);
    data.value = dictData;
  }

  async function getRecord() {
    if (!data.value.length) {
      await getData();
    }
    data.value.forEach(dict => {
      record.value[dict.dictValue!] = dict;
    });
  }

  async function getOptions() {
    if (!data.value.length) {
      await getData();
    }

    options.value = data.value.map(dict => ({ label: dict.dictLabel!, value: dict.dictValue! }));
  }

  /** 跳过本地/服务端缓存，重新拉取（字典管理新增项后建议调用） */
  async function reload() {
    dictStore.removeDict(dictType);
    data.value = [];
    record.value = {};
    options.value = [];
    await getData();
    await getRecord();
    await getOptions();
  }

  function transformDictData(dictValue: string[] | number[] | string | number) {
    if (!data.value.length || isNull(dictValue)) return undefined;
    if (Array.isArray(dictValue)) {
      return data.value.filter(dict => dictValue.some(value => dict.dictValue === value.toString()));
    }
    return data.value.filter(dict => dict.dictValue === dictValue.toString());
  }

  if (immediate) {
    getData().then(() => {
      getRecord();
      getOptions();
    });
  } else {
    watch(
      () => dictList.value[dictType],
      val => {
        if (val && val.length) {
          getRecord();
          getOptions();
        }
      },
      { immediate: true }
    );
  }

  return {
    data,
    record,
    options,
    getData,
    getRecord,
    getOptions,
    reload,
    transformDictData
  };
}
