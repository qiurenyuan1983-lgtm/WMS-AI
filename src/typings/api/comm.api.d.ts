declare namespace Api {
  namespace Comm {
    type ConversationType =
      | 'direct'
      | 'group'
      | 'customer'
      | 'supplier'
      | 'driver'
      | 'order'
      | 'trip'
      | 'exception'
      | 'bill'
      | 'system'
      | 'internal';

    type MessageType =
      | 'text'
      | 'image'
      | 'file'
      | 'voice'
      | 'video'
      | 'card_order'
      | 'card_trip'
      | 'card_container'
      | 'card_exception'
      | 'card_bill'
      | 'card_todo'
      | 'system';

    type Conversation = {
      id: string;
      type: ConversationType;
      name: string;
      avatarText: string;
      avatarColor?: string;
      lastMessage: string;
      lastTime: string;
      unreadCount: number;
      pinned?: boolean;
      muted?: boolean;
      mentioned?: boolean;
      hasBizLink?: boolean;
      hasTodo?: boolean;
      overdueReply?: boolean;
      bizType?: 'order' | 'trip' | 'container' | 'exception' | 'bill' | null;
      bizId?: string | null;
      memberCount?: number;
    };

    type ChatMessage = {
      id: string;
      conversationId: string;
      senderName: string;
      senderRole?: string;
      isSelf: boolean;
      type: MessageType;
      content: string;
      time: string;
      read?: boolean;
      cardPayload?: Record<string, string>;
      reactions?: string[];
    };

    type BusinessContext = {
      conversationId: string;
      bizType: 'order' | 'trip' | 'container' | 'exception' | 'bill';
      title: string;
      fields: Array<{ label: string; value: string; highlight?: boolean }>;
      actions: Array<{ key: string; label: string; type?: 'primary' | 'default' | 'warning' }>;
    };

    type ContactNode = {
      key: string;
      label: string;
      type?: 'dept' | 'person';
      title?: string;
      phone?: string;
      email?: string;
      company?: string;
      children?: ContactNode[];
    };

    type CommTodo = Common.CommonRecord<{
      id: CommonType.IdType;
      title: string;
      source: string;
      assignee: string;
      dueTime: string;
      status: 'pending' | 'done';
      bizNo?: string;
    }>;

    type CommFile = Common.CommonRecord<{
      id: CommonType.IdType;
      fileName: string;
      fileType: string;
      sizeLabel: string;
      uploader: string;
      bizNo?: string;
      uploadTime: string;
    }>;

    type CommOrderOption = {
      orderNo: string;
      customerName: string;
      destination: string;
      containerCs: string;
      status?: string;
    };

    type CommApprovalFile = {
      id: string;
      fileName: string;
      fileType: string;
      sizeLabel: string;
      orderNo: string;
      status: '待审批' | '已通过' | '已驳回';
      approver?: string;
      updateTime: string;
    };

    type CommOrderDetail = {
      orderNo: string;
      customerName: string;
      destination: string;
      containerCs: string;
      status: string;
      palletQty: number;
      cartonQty?: number;
      weightKg?: number;
      volumeCbm?: number;
      warehouse?: string;
      locationCodes?: string;
      isaStatus?: string;
      appointmentTime?: string;
      inboundTime?: string;
      exceptionStatus?: string;
      billStatus?: string;
      remark?: string;
      timeline?: Array<{ time: string; event: string; operator?: string }>;
    };
  }
}
