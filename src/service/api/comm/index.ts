import { request } from '@/service/request';

export function fetchGetConversationList(params?: Record<string, unknown>) {
  return request<Api.Comm.Conversation[]>({ url: '/comm/conversation/list', method: 'get', params });
}

export function fetchGetMessageList(conversationId: string) {
  return request<Api.Comm.ChatMessage[]>({
    url: '/comm/message/list',
    method: 'get',
    params: { conversationId }
  });
}

export function fetchGetBusinessContext(conversationId: string) {
  return request<Api.Comm.BusinessContext | null>({
    url: '/comm/business/context',
    method: 'get',
    params: { conversationId }
  });
}

export function fetchGetContactTree() {
  return request<Api.Comm.ContactNode[]>({ url: '/comm/contacts/tree', method: 'get' });
}

export function fetchGetCommTodoList(params?: Api.Common.CommonSearchParams) {
  return request<Api.Comm.CommTodo[]>({ url: '/comm/todo/list', method: 'get', params });
}

export function fetchGetCommFileList(params?: Api.Common.CommonSearchParams) {
  return request<Api.Comm.CommFile[]>({ url: '/comm/file/list', method: 'get', params });
}

export function fetchSearchCommOrders(keyword?: string) {
  return request<Api.Comm.CommOrderOption[]>({
    url: '/comm/order/search',
    method: 'get',
    params: { keyword }
  });
}

export function fetchGetCommApprovalFiles(params?: { keyword?: string; orderNo?: string }) {
  return request<Api.Comm.CommApprovalFile[]>({
    url: '/comm/approval-file/list',
    method: 'get',
    params
  });
}

export function fetchGetCommOrderDetail(orderNo: string) {
  return request<Api.Comm.CommOrderDetail | null>({
    url: '/comm/order/detail',
    method: 'get',
    params: { orderNo }
  });
}
