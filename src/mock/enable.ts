/** 是否启用前端 Mock（原型模式，不请求后端） */
export function isMockMode(): boolean {
  return import.meta.env.VITE_USE_MOCK === 'Y';
}
